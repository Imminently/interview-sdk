import debounce from "lodash-es/debounce";
import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";
import isEqual from "lodash-es/isEqual";
import set from "lodash-es/set";
import pako from "pako";
import { ApiManager, type ApiManagerOptions } from "./api-manager";
// import { back, chat, create, exportTimeline, load, navigate, postSimulate, submit } from "./api";
import { type SidebarSimulate, type UnknownValues, buildDynamicReplacementQueries } from "./dynamic";
import { FileManager, type FileManagerOptions } from "./file-manager";
import { SIDEBAR_DYNAMIC_DATA_INFO } from "./sidebars/sidebar";
import type {
  AttributeValues,
  ChatResponse,
  Control,
  InterviewContainerControl,
  Overrides,
  RulesEngine,
  Screen,
  Session,
  SessionConfig,
  Step,
  StepId,
} from "./types";
import {
  createEntityPathedData,
  deepClone,
  flattenObject,
  iterateControls,
  pathToNested,
  postProcessControl,
  transformResponse,
} from "./util";

const BOOKMARK_KEY = "immi_cg_bookmark_3";

/**
 * Constructs the input object from the preprocessed state for rules engine evaluation.
 * This function reconstructs the entity structure and applies user values and previous values.
 *
 * @param preProcessedState - The preprocessed state containing entity structure and nodes
 * @param data - The session data containing parent information
 * @param userValues - The current user input values
 * @returns The constructed input object for rules engine evaluation
 */
export const constructInputFromPreProcessed = (
  preProcessedState: any,
  data: Record<string, any> & { "@parent": string | undefined },
  userValues: AttributeValues,
  existingData?: any,
): any => {
  // reconstruct the entity structure from the preprocessed state
  const input = existingData ?? preProcessedState?.entityStructure ?? {};
  const parent = data["@parent"];

  // Apply previous values from preprocessed nodes
  if (preProcessedState?.nodes) {
    for (const [key, value] of Object.entries(preProcessedState.nodes)) {
      const prev = (value as any)?.previousValue;
      if (prev !== undefined) {
        const nestedPath = pathToNested(key, input, true).split(".");
        set(input, nestedPath, prev);
      }
    }
  }

  // Apply user values to the appropriate parent context
  if (parent) {
    const nestedPath = pathToNested(parent, input, true).split(".");
    const existing = get(input, nestedPath);

    set(input, pathToNested(parent, input, true), {
      ...existing,
      ...userValues,
    });
  } else {
    Object.assign(input, userValues);
  }

  return input;
};

const LogGroup = "SessionManager";

// given json data as a string, parse it safely, returning undefined if parsing fails
const safeParseData = (data: string | undefined): any | undefined => {
  try {
    if (!data || typeof data !== "string") {
      return undefined;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error(LogGroup, "Error parsing data:", e);
    return undefined;
  }
};

/**
 * Utility to determine if a given step is the first step in the interview.
 * @param steps The array of steps in the session.
 * @param id The ID of the step to check.
 * @returns True if the step is the first step, false otherwise.
 */
export const isFirstStep = (steps: Step[], id: string): boolean => {
  if (!Array.isArray(steps) || steps.length === 0) return false;
  const first = steps[0];
  if (first.id === id) return true;
  if (first.steps?.length) return isFirstStep(first.steps, id);
  return false;
};

/**
 * Utility to determine if a given step is the last step in the interview.
 * @param steps The array of steps in the session.
 * @param id The ID of the step to check.
 * @returns True if the step is the last step, false otherwise.
 */
export const isLastStep = (steps: Step[], id: string): boolean => {
  if (!Array.isArray(steps) || steps.length === 0) return false;
  const last = steps[steps.length - 1];
  if (last.id === id) return true;
  if (last.steps?.length) return isLastStep(last.steps, id);
  return false;
};

/**
 * Utility to check if a session is complete.
 * @param session The session instance to check.
 * @returns True if the session is complete, false otherwise.
 */
export const isComplete = (session: Session): boolean => {
  return session.status === "complete";
};

export type ManagerState = "loading" | "error" | "success";

export interface SessionSnapshot {
  state: ManagerState;
  error?: Error;
  session: Session | null;
  loading: boolean; // indicates if the session is currently awaiting an external operation
  renderAt: number; // timestamp of the last render
}

interface SessionInternal {
  userValues: AttributeValues;
  prevUserValues: AttributeValues;

  replacements: AttributeValues;
  unknownsRequiringSimulate: UnknownValues;
  unknownsAlreadySimulated: UnknownValues;
  sidebarSimulate: SidebarSimulate | undefined;

  // we only care about the latest request
  latestRequest: number | undefined;

  // progress tracking
  canProgress: boolean;
}

export interface Storage {
  get: () => any;
  set: (value: any) => void;
}

export interface ManagerOptions {
  /** Enables debug logs */
  debug?: boolean;
  /**
   * If true, will pre-load/cache client side dynamic runtime.
   * Note requires an initial sessionConfig to be provided.
   */
  preCacheClient?: boolean;
  apiManager: ApiManager | ApiManagerOptions;
  fileManager: FileManager | FileManagerOptions;
  /** Initial session config. If provided, will automatically start an interview on creation */
  sessionConfig?: SessionConfig;
  /** EXPERIMENTAL: trying out adding support to load/store sessions */
  sessionStore?: Storage;
  readOnly?: boolean;
}

export const updateReportingWithReplacements = (reporting: any, replacements: any, parent?: string) => {
  if (!reporting) return;
  const result = structuredClone(reporting);

  // Step 1: Normalize all arrays in replacements to objects keyed by @id or index
  const normalizeIdBasedObject = (object: any) => {
    if (!object || typeof object !== "object") {
      return object;
    }
    if (Array.isArray(object)) {
      return object.reduce((idBasedObject, item, index) => {
        const key = item && item["@id"] ? item["@id"] : index;
        // Remove @id from the nested object
        const { ["@id"]: _omit, ...rest } = item || {};
        idBasedObject[key] = normalizeIdBasedObject(rest);
        return idBasedObject;
      }, {} as any);
    }
    const result: any = {};
    for (const [key, value] of Object.entries(object)) {
      if (key === "@id") continue;
      if (key.includes("/")) continue;
      result[key] = normalizeIdBasedObject(value);
    }
    return result;
  };

  const normalized = normalizeIdBasedObject(replacements);

  // Step 2: For any keys in the normalized object that contain '/', split and use lodash set to build a flat newValues object

  const handleSlashKeys = (obj: any, out: any = {}) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key.includes("/")) {
        const path = key.split("/");
        set(out, path, value);
      } else {
        out[key] = value;
      }
    }
    return out;
  };

  const newValues = handleSlashKeys(normalized);

  const flattened = flattenObject(newValues, "/");

  // Step 3: For each key in newValues, if the path exists in reporting, update it
  for (const [key, value] of Object.entries(flattened)) {
    const path = key.split("/");
    if (get(result, path) !== undefined) {
      set(result, path, value);
    }
  }

  return result;
};

interface ClientGraphBookmarkData {
  id: string;
  clientGraph: any;
}

const getClientGraphForSession = (session: Session) => {
  if (!session?.clientGraph && !session?.decompressedClientGraph) {
    return undefined;
  }

  if (!session.decompressedClientGraph) {
    const decompressed = JSON.parse(
      // @ts-ignore string should work
      pako.inflate(session.clientGraph, { to: "string" }),
    );
    session.decompressedClientGraph = decompressed;
  }

  return session.decompressedClientGraph;
};

/**
 * SessionManager is the main class for managing sessions in the interview SDK.
 * It handles creating, loading, and managing multiple sessions,
 * as well as providing utilities for dynamic updates and session state management.
 */
export class SessionManager {
  private sessions: Session[];
  private active: number;
  private state: ManagerState;
  private error?: Error;
  private listeners: Set<() => void>;
  private _options: ManagerOptions;
  private apiManager: ApiManager;
  private fileManager: FileManager;
  private snapCache?: SessionSnapshot;

  private debugEnabled: boolean;
  private advancedDebugEnabled;

  private renderAt: number = Date.now();
  private externalLoading = false;
  private rulesEnginePromise: Promise<RulesEngine> | undefined = undefined;

  private internals: SessionInternal = {
    userValues: {},
    prevUserValues: {},
    replacements: {},
    unknownsRequiringSimulate: {},
    unknownsAlreadySimulated: {},
    latestRequest: undefined,
    sidebarSimulate: undefined,
    canProgress: false,
  };

  constructor(options: ManagerOptions) {
    const store = options.sessionStore?.get() ?? { sessions: [], active: 0 };
    this.sessions = store.sessions;
    this.active = store.active;
    this.state = this.sessions.length > 0 ? "success" : "loading";
    this.error = undefined;
    this._options = options;
    this.listeners = new Set();
    this.debugEnabled = Boolean(options.debug);
    this.advancedDebugEnabled = false;

    // create the API manager
    this.apiManager =
      options.apiManager instanceof ApiManager
        ? options.apiManager
        : new ApiManager(options.apiManager as ApiManagerOptions);

    // create the file manager
    this.fileManager =
      options.fileManager instanceof FileManager
        ? options.fileManager
        : new FileManager(options.fileManager as FileManagerOptions);

    // auto start a session if sessionConfig is provided
    if (options.sessionConfig && this.sessions.length === 0) {
      const { sessionConfig } = options;
      this.log("Initializing session with config:", sessionConfig);
      this.create(sessionConfig).catch((error) => {
        console.error(LogGroup, "Error creating initial session:", error);
        this.setState("error", error as Error);
      });
    }

    // @ts-ignore
    this.serverSideDynamic = debounce(this.serverSideDynamic.bind(this), 1000);
  }

  private log = (message: string, ...args: any[]) => {
    if (this.isDebugEnabled()) {
      console.log(`[DEBUG:${LogGroup}] ${message}`, ...args);
    }
  };

  private setState = (state: ManagerState, error?: Error) => {
    this.state = state;
    this.error = error || undefined;
    this.log("State updated:", this.state, this.error);
    this.notifyListeners();
  };

  isDebugEnabled = () => {
    return this.debugEnabled;
  };

  isAdvancedDebugEnabled = () => {
    return this.advancedDebugEnabled;
  };

  setDebugEnabled = (enabled: boolean) => {
    this.debugEnabled = enabled;
    if (!enabled) {
      this.advancedDebugEnabled = false;
    }
  };

  setAdvancedDebugEnabled = (enabled: boolean) => {
    this.advancedDebugEnabled = enabled;
  };

  private preCacheClient = () => {
    // try to pre-cache the client-side dynamic runtime
    if (this.options.preCacheClient && !this.rulesEnginePromise) {
      this.log("Pre-caching client-side dynamic runtime");
      this.rulesEnginePromise = this.loadRulesEngine();
    }
  };

  /**
   * The session currently being used to display screen control.
   * Applicable if you are using sub-interviews.
   * If not, just use `session` instead.
   */
  get activeSession(): Session | null {
    if (this.sessions.length === 0) return null;
    return this.sessions[this.active];
  }

  /**
   * The main session being used to display screen controls.
   * This is the first/primary session.
   */
  get session(): Session | null {
    if (this.sessions.length === 0) return null;
    return this.sessions[0];
  }

  /**
   * Utility to determine if the active session is a sub-interview.
   */
  get isSubInterview(): boolean {
    if (this.sessions.length < 2) return false;
    return this.active > 0;
  }

  get numberOfSessions() {
    return this.sessions.length;
  }

  get options() {
    return this._options;
  }

  isOnScreen = (control: Control, screen?: Screen): boolean => {
    if (!screen && !this.activeSession) return false;
    // const { screen } = this.activeSession;
    screen = screen || this.activeSession?.screen;
    if (!screen) return false;
    let isOnScreen = false;
    iterateControls(
      screen.controls,
      (c) => {
        if (c.id === control.id) {
          isOnScreen = true;
        }
      },
      true,
    );
    return isOnScreen;
  };

  push = (session: Session) => {
    this.sessions.push(session);
    this.active = this.sessions.length - 1; // always set active to the last session
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }
  };

  pop = () => {
    if (this.sessions.length === 0) return null;
    const session = this.sessions.pop();
    this.active = this.sessions.length - 1; // set active to the last session
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }
    return session;
  };

  setActive = (index: number) => {
    if (index < 0 || index >= this.sessions.length) {
      console.warn(LogGroup, `Invalid session index: ${index}. Must be between 0 and ${this.sessions.length - 1}`);
      return;
    }
    this.active = index;
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }
  };

  private handleClientGraphBookmark(session: Session) {
    if (session.clientGraphBookmark) {
      if (!session.clientGraph) {
        const bookmarkRaw = localStorage.getItem(BOOKMARK_KEY);
        if (!bookmarkRaw) {
          return;
        }

        const bookmarkData = JSON.parse(bookmarkRaw) as ClientGraphBookmarkData;
        if (bookmarkData.id === session.clientGraphBookmark) {
          session.clientGraph = bookmarkData.clientGraph;
          this.log("Loaded client graph from bookmark", {
            id: session.clientGraphBookmark,
          });
        }
      } else {
        this.log("Saved client graph bookmark", {
          id: session.clientGraphBookmark,
        });
        localStorage.setItem(
          BOOKMARK_KEY,
          JSON.stringify({
            clientGraph: session.clientGraph,
            id: session.clientGraphBookmark,
          } satisfies ClientGraphBookmarkData),
        );
      }
    }
  }

  create = async (config: SessionConfig): Promise<Session> => {
    this.log("Creating session:", config);
    this.setState("loading");
    const session = await this.apiManager.create({
      config: {
        ...config,
        clientGraphBookmark: this.getClientGraphBookmark(),
        readOnly: this.options.readOnly,
      },
    });
    this.log("Session created successfully:", session);
    this.setState("success");
    this.push(session);
    this.updateSession(session);
    // if we successfully created a session, try to pre-cache the client-side dynamic runtime
    this.preCacheClient();
    return session;
  };

  load = async (config: SessionConfig): Promise<Session> => {
    this.log("Loading session:", config);
    this.setState("loading");
    const session = await this.apiManager.load({
      ...config,
      clientGraphBookmark: this.getClientGraphBookmark(),
    });
    this.log("Session loaded successfully:", session);
    this.setState("success");
    this.push(session);
    this.updateSession(session);
    // if we successfully created a session, try to pre-cache the client-side dynamic runtime
    this.preCacheClient();
    return session;
  };

  createSubInterview = async (control: InterviewContainerControl) => {
    // this one can always use the parent session
    if (!this.session) {
      console.error(LogGroup, "No session available to create sub-interview");
      return;
    }

    const { interviewRef, initialData } = control;
    // NOTE do not support workspaceId yet
    const { interactionMode, interviewId, projectId } = interviewRef;
    if (!["same-session", "new-session", "different-project"].includes(interactionMode)) {
      console.error(LogGroup, `Invalid interaction mode: ${interactionMode}`);
      return;
    }

    const createOpts: SessionConfig = {
      project: projectId,
      interview: interviewId,
      initialData: safeParseData(initialData),
    };

    if (interactionMode === "same-session") {
      createOpts.sessionId = this.session.sessionId;
    }

    try {
      const subSession = await this.create(createOpts);
      this.log("Sub-interview created successfully:", subSession);
      return subSession;
    } catch (error) {
      console.error(LogGroup, "Error creating sub-interview:", createOpts, error);
      this.setState("error", error as Error);
    }
  };

  subscribe = (callback: () => void): (() => void) => {
    this.log("Subscribing to session updates");
    this.listeners.add(callback);
    return () => {
      this.log("Unsubscribing from session updates");
      this.listeners.delete(callback);
    };
  };

  getSnapshot = (): SessionSnapshot => {
    // debugger;
    const snap = {
      state: this.state,
      error: this.error,
      loading: this.externalLoading,
      session: this.session,
      // ? ({
      //   ...this.session,
      //   screen: this.session?.screen,
      // } as Session)
      // : null,
      renderAt: this.renderAt,
    };
    // run json stringify to ensure we have a clean snapshot
    const equal = JSON.stringify(snap) === JSON.stringify(this.snapCache);
    if (this.snapCache && equal) {
      this.log("Returning cached snapshot");
      return this.snapCache;
    }
    this.log("Creating new snapshot", snap);
    this.snapCache = deepClone(snap);
    return this.snapCache;
  };

  notifyListeners = () => {
    this.log("Notifying listeners of session update", this.session);
    for (const listener of this.listeners) {
      listener();
    }
  };

  onScreenDataChange = (data: AttributeValues) => {
    this.log("Screen data changed:", data);
    this.internals.userValues = deepClone(data);
    this.clientSideDynamic();
  };

  // -- session getters

  get clientGraph() {
    if (!this.activeSession) {
      return null;
    }
    return getClientGraphForSession(this.activeSession);
  }

  get canProgress() {
    return this.internals.canProgress;
  }

  get isLastStep() {
    if (!this.activeSession) return false;
    const { steps, screen } = this.activeSession;
    return isLastStep(steps, screen.id);
  }

  get isComplete() {
    if (!this.activeSession) return false;
    return isComplete(this.activeSession);
  }

  getExplanation = (attribute: string) => {
    if (!this.activeSession) return undefined;
    const id = attribute.split(".").pop();
    return id && this.activeSession.explanations?.[id];
  };

  // get screen() {
  //   return this.processedScreen ?? this.session.screen;
  // }

  // TODO find where and why these are used

  // get graph() {
  //   return (this.session as any).graph;
  // }

  // set graph(graph) {
  //   // TODO cant directly set this, as we need it to be immutable
  //   // (this.session as any).graph = graph;
  //   this.sessions[this.active].graph = graph; // update the active session's graph
  // }

  // get reporting() {
  //   return (this.session as any).reporting;
  // }

  // get report() {
  //   return (this.session as any).report;
  // }

  // set report(report) {
  //   // TODO cant directly set this, as we need it to be immutable
  //   (this.session as any).report = report;
  // }

  private triggerUpdate = (update: Partial<{ externalLoading: boolean; screen: Screen }>) => {
    const { externalLoading, screen } = update;

    if (typeof externalLoading === "boolean") {
      this.externalLoading = externalLoading;
    }
    this.renderAt = Date.now();
    // update store
    this.options.sessionStore?.set({
      sessions: this.sessions,
      active: this.active,
    });
    this.log("Triggering update", update);
    this.notifyListeners();
  };

  async runRulesEngine(debug?: boolean) {
    if (!this.activeSession || !this.clientGraph) {
      return;
    }
    const { data, screen } = this.activeSession;
    if (!this.rulesEnginePromise) {
      this.rulesEnginePromise = this.loadRulesEngine();
    }

    // reconstruct the entity structure from the preprocessed state
    const input = constructInputFromPreProcessed(
      this.activeSession?.preProcessedState,
      data,
      this.internals.userValues,
      // @ts-ignore
      this.activeSession?.__deprecatedSessionData,
    );

    const rulesEngine = await this.rulesEnginePromise;
    const release = {
      id: screen.id,
      relationships: this.activeSession!.relationships || [],
      rule_graph: this.clientGraph,
      inferredOrder: this.activeSession!.inferredOrder,
    };

    const goalsToSolveSet = new Set<string>();

    if (this.activeSession.state) {
      for (const stateItem of this.activeSession.state) {
        goalsToSolveSet.add(stateItem.id);
      }
    }
    const roots = Array.from(goalsToSolveSet);
    if (!roots.length) {
      return undefined;
    }

    const goal = roots[0];
    this.log(`[${LogGroup}] Release:`, release);
    this.log(`[${LogGroup}] Payload:`, {
      "@goal": goal,
      "@root": roots,
      ...input,
    });

    const result = await rulesEngine.solve(
      {
        input: input,
        roots: roots,
        goal: goal,
        response_elements: [
          {
            type: "attributes",
            ids: roots.map((path) => path.split("/").pop()),
          },
          debug
            ? {
              type: "graph",
              debug: true,
            }
            : undefined,
        ].filter(Boolean) as any,
      },
      screen.id,
      {
        getRelease: () => {
          return release;
        },
      },
      {},
    );

    this.log(`[${LogGroup}] Calculated':`, structuredClone(result));

    return result;
  }

  private clientSideDynamic = async () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to process dynamic values");
      return;
    }
    const { state, locale, data, screen } = this.activeSession;
    this.internals.latestRequest = Date.now();

    if (state && screen) {
      this.log("Checking for changes", this.internals.prevUserValues, this.internals.userValues);

      if (
        !isEqual(this.internals.prevUserValues, this.internals.userValues) &&
        Object.keys(this.internals.userValues).length > 0
      ) {
        const replacementQueries = buildDynamicReplacementQueries(this.activeSession, this.internals.userValues);
        Object.assign(this.internals.replacements, replacementQueries?.knownValues);

        for (const [key, value] of Object.entries(replacementQueries.unknownValues)) {
          if (value) {
            const alreadySimulated = this.internals.unknownsAlreadySimulated[key];
            if (alreadySimulated) {
              if (isEqual(alreadySimulated.data, value.data)) {
                continue;
              }
            }
          }
          this.internals.unknownsRequiringSimulate[key] = value;
        }

        this.log("Calculated replacement queries:", replacementQueries);

        const newScreen = this.makeScreenCopy();
        if (Object.keys(this.internals.unknownsRequiringSimulate).length > 0) {
          // Get all goals that need to be solved
          const goalsToSolveSet = new Set(Object.keys(this.internals.unknownsRequiringSimulate));

          const goalsToSolve = Array.from(goalsToSolveSet);

          // Handle client-side calculations first
          if (goalsToSolve.length > 0 && this.clientGraph) {
            try {
              const result = await this.runRulesEngine();

              const replacements = createEntityPathedData({
                ...result.reporting.global,
                ...result.reporting,
                global: undefined,
              });
              this.log(`[${LogGroup}] Replacements':`, replacements);

              //if (result.result !== undefined) {
              // Update replacements with solved values
              Object.assign(this.internals.replacements, replacements);

              this.activeSession.validations = result.validations;
            } catch (error) {
              console.error(`[${LogGroup}] Error solving goal "${this.activeSession.goal}" client-side:`, error);
            }

            // Update screen with new values
            if (newScreen?.controls) {
              iterateControls(newScreen.controls, (control: any) => {
                control.loading = undefined;
                postProcessControl(control, this.internals.replacements, data, state, locale);
              });
            }

            // Update progress state
            const nextButton = screen.buttons?.next;
            if (nextButton && typeof nextButton === "object") {
              this.internals.canProgress = nextButton.dependencies.every(
                (attr) => (this.internals.userValues[attr] || this.internals.replacements[attr]) === true,
              );
            }
          }
        }

        this.activeSession.reporting = updateReportingWithReplacements(
          this.activeSession.reporting,
          this.internals.replacements,
          this.activeSession.data?.["@parent"],
        );
        this.log("New reporting object", this.activeSession.reporting);

        this.internals.sidebarSimulate = replacementQueries.sidebarSimulate;
        if (newScreen.sidebars) {
          for (const sidebar of newScreen.sidebars) {
            if (sidebar.id) {
              sidebar.loading = this.internals.sidebarSimulate?.ids.includes(sidebar.id);
            }
          }
        }

        const requiresServiceDynamic = Boolean(
          !this.clientGraph &&
          (Object.keys(this.internals.unknownsRequiringSimulate).length > 0 ||
            replacementQueries.sidebarSimulate?.ids?.length),
        );

        this.activeSession.screen = newScreen;
        this.updateSession(this.activeSession);

        // Handle any remaining unknowns that require server-side simulation
        if (requiresServiceDynamic) {
          this.triggerUpdate({
            externalLoading: true,
            screen: newScreen,
          });
          this.serverSideDynamic();
        } else {
          this.triggerUpdate({
            externalLoading: false,
            screen: newScreen,
          });
        }
      }
    }
    this.internals.prevUserValues = structuredClone(this.internals.userValues);
  };

  private loadRulesEngine = async (): Promise<RulesEngine> => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to load rules engine");
      throw new Error("No active session to load rules engine");
    }
    const engine = await this.apiManager.getRulesEngine({ checksum: this.activeSession.rulesEngineChecksum });
    // biome-ignore lint: https://esbuild.github.io/content-types/#direct-eval
    return (0, eval)(engine);
  };

  private makeScreenCopy = (screen?: Screen) => {
    return deepClone(screen ?? this.activeSession!.screen);
  };

  // this function is debounced
  private serverSideDynamic = async () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to process server-side dynamic values");
      return;
    }
    let newScreen: Screen | undefined;
    if (Object.keys(this.internals.unknownsRequiringSimulate).length > 0 && this.activeSession.screen) {
      const requestId = this.internals.latestRequest;

      const result = await this.apiManager.simulate({
        session: this.activeSession,
        payload: {
          goal: this.activeSession.goal,
          mode: "interview",
          data: {
            "@parent": this.activeSession.data["@parent"],
            ...(this.internals.userValues as any),
          },
        },
      });

      // are we still the last request?
      if (this.internals.latestRequest === requestId) {
        newScreen = result.screen;
        this.updateSession(result);

        this.internals.unknownsAlreadySimulated = {
          ...this.internals.unknownsRequiringSimulate,
        };
        this.internals.unknownsRequiringSimulate = {};
      }
    }

    if (newScreen) {
      this.log("Simulate sidebar?", this.internals.sidebarSimulate);

      if (this.internals.sidebarSimulate) {
        const result = await this.apiManager.simulate({
          session: this.activeSession,
          payload: this.internals.sidebarSimulate.simulate?.data,
        });
        for (const sidebarId of this.internals.sidebarSimulate.ids) {
          const screenSidebar = newScreen.sidebars?.find((s) => s.id === sidebarId);
          if (screenSidebar) {
            const dataInfo = SIDEBAR_DYNAMIC_DATA_INFO[screenSidebar.type as keyof typeof SIDEBAR_DYNAMIC_DATA_INFO];
            if (dataInfo) {
              try {
                Object.assign(screenSidebar.data, dataInfo.generateData(screenSidebar.config, result));
              } catch (error) {
                console.error(`[${LogGroup}] Error generating sidebar data`, error);
              }
            }
            screenSidebar.loading = false;
          }
        }
      }

      const nextButton = newScreen.buttons?.next;
      if (nextButton && typeof nextButton === "object") {
        this.internals.canProgress = nextButton.dependencies.every(
          (attr) => (this.internals.userValues[attr] || this.internals.replacements[attr]) === true,
        );
      }
    }

    if (newScreen) {
      this.triggerUpdate({
        externalLoading: false,
        screen: newScreen,
      });
    }
  };

  /** NOTE Will run notifyListeners if changes occured */
  private updateSession = (session: Session) => {
    const prevSession = this.session;
    const currentRenderAt = this.renderAt;
    // this.session = session;
    this.sessions[this.active] = session; // update the active session in the array
    if (!isEmpty(session.screen)) {
      const replacements: AttributeValues = {};
      if (session.state) {
        for (const stateObj of session.state) {
          if (replacements[stateObj.id] === undefined && stateObj.value) {
            replacements[stateObj.id] = stateObj.value;
          }
        }
      }
      if (prevSession?.screen?.id !== session.screen?.id) {
        const nextButton = session.screen.buttons?.next;
        let canProgress = true;
        if (nextButton && typeof nextButton === "object") {
          canProgress = nextButton.defaultEnabled;
        }

        this.internals = {
          userValues: {},
          prevUserValues: {},
          replacements: replacements,
          unknownsRequiringSimulate: {},
          unknownsAlreadySimulated: {},
          latestRequest: undefined,
          sidebarSimulate: undefined,
          canProgress: canProgress,
        };
      }
      /*this.processedScreen = produce(session.screen as Screen, (draft) => {
        iterateControls(draft.controls, (control: any) => {
          postProcessControl(control, this.internals.replacements);
        });
      });

      // call this first so the debounce doesn't fire during unknown calculation
      this.updateDynamicValues();
      this.calculateUnknowns();

      // force trigger an update of dynamic values
      // @ts-ignore
      this.updateDynamicValues.flush();*/
    }

    this.handleClientGraphBookmark(session);

    // hasn't updated, force it
    if (currentRenderAt === this.renderAt) {
      this.triggerUpdate({
        screen: session.screen,
      });
    }
  };

  private getClientGraphBookmark() {
    const bookmarkRaw = localStorage.getItem(BOOKMARK_KEY);
    if (bookmarkRaw) {
      return (JSON.parse(bookmarkRaw) as ClientGraphBookmarkData).id;
    }
    return undefined;
  }

  // public methods

  submit = async (data: AttributeValues, navigate?: any, overrides: Overrides = {}) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to submit data");
      return Promise.resolve(null);
    }
    this.triggerUpdate({ externalLoading: true });

    const session = await this.apiManager.submit({
      session: this.activeSession,
      data: transformResponse(this.activeSession, data as any),
      navigate,
      overrides: {
        // response: this.options.responseElements,
        ...overrides,
      },
      clientGraphBookmark: this.getClientGraphBookmark(),
      readOnly: this.options.readOnly,
    });
    this.updateSession(session);
    this.triggerUpdate({ externalLoading: false });
    return this;
  };

  chat = async (
    goal: string,
    message: string,
    interactionId?: string | null,
    overrides?: Overrides,
  ): Promise<ChatResponse> => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to chat with");
      throw new Error("No active session to chat with");
    }
    try {
      this.triggerUpdate({ externalLoading: true });
      const payload = await this.apiManager.chat({
        session: this.activeSession,
        message,
        goal,
        overrides,
        interactionId,
      });
      this.triggerUpdate({ externalLoading: false });
      return payload;
    } catch (error) {
      this.triggerUpdate({ externalLoading: false });
      throw error;
    }
  };

  navigate = async (step: StepId) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to navigate from");
      throw new Error("No active session to navigate from");
    }
    this.triggerUpdate({ externalLoading: true });
    this.updateSession(
      await this.apiManager.navigate({
        session: this.activeSession,
        step,
        readOnly: this.options.readOnly,
      }),
    );
    this.triggerUpdate({ externalLoading: false });
    return this;
  };

  back = async () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to go back from");
      throw new Error("No active session to go back from");
    }
    this.triggerUpdate({ externalLoading: true });
    if (this.isSubInterview && isFirstStep(this.activeSession.steps, this.activeSession.screen.id)) {
      // pop the session, then we will invoke back on the parent
      this.pop();
    }
    this.updateSession(
      await this.apiManager.back({
        session: this.activeSession,
        readOnly: this.options.readOnly,
      }),
    );
    this.triggerUpdate({ externalLoading: false });
    return this;
  };

  next = async (data: AttributeValues) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to next data");
      throw new Error("No active session to next data");
    }
    this.triggerUpdate({ externalLoading: true });
    if (this.isSubInterview && isComplete(this.activeSession)) {
      // pop the session, then we will invoke next on the parent
      this.pop();
    }
    this.updateSession(
      await this.apiManager.submit({
        session: this.activeSession,
        data: transformResponse(this.activeSession, data as any),
        navigate: false,
        overrides: {
          // response: this.options.responseElements,
        },
        clientGraphBookmark: this.getClientGraphBookmark(),
        readOnly: this.options.readOnly,
      }),
    );
    this.triggerUpdate({ externalLoading: false });
    return this;
  };

  exportTimeline = () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to export timeline from");
      throw new Error("No active session to export timeline from");
    }
    return this.apiManager.exportTimeline({ session: this.activeSession });
  };

  // file management methods

  get uploadFile() {
    return this.fileManager.uploadFile.bind(this.fileManager);
  }

  get downloadFile() {
    return this.fileManager.downloadFile.bind(this.fileManager);
  }

  get removeFile() {
    return this.fileManager.removeFile.bind(this.fileManager);
  }

  get onFileTooBig() {
    return this.fileManager.onFileTooBig.bind(this.fileManager);
  }
}
