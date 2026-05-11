import debounce from "lodash/debounce";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import { ApiManager, type ApiManagerOptions } from "./api-manager";
// import { back, chat, create, exportTimeline, load, navigate, postSimulate, submit } from "./api";
import { type SidebarSimulate, type UnknownValues, buildDynamicReplacementQueries } from "./dynamic";
import { FileManager, type FileManagerOptions } from "./file-manager";
import {
  ManagerLifecycle,
  type ManagerLifecycleActiveSessionChangeSource,
  type ManagerLifecycleErrorSource,
  type ManagerLifecycleOptions,
  type ManagerLifecycleSessionStartSource,
  type ManagerLifecycleSessionUpdateSource,
} from "./manager-events";
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
import { replaceTemplatedText } from "./helpers";
import { decompressGraph, graphFromJSON } from "./graphUtil";
import { produce } from "immer";

const BOOKMARK_KEY = "immi_cg_bookmark_3";

/**
 * Constructs the input object from the preprocessed state for rules engine evaluation.
 * This function reconstructs the entity structure and applies user values and previous values.
 *
 * @param preProcessedState - The preprocessed state containing entity structure and nodes
 * @param data - The session data containing parent information
 * @param userValues - The current user input values
 * @param existingData - Optional existing data to merge into. It should come from the backend and contain information we might need.
 * @returns The constructed input object for rules engine evaluation
 */
export const constructInputFromPreProcessed = (
  preProcessedState: any,
  data: Record<string, any> & { "@parent": string | undefined },
  userValues: AttributeValues,
  existingData?: any,
): any => {
  // reconstruct the entity structure from the existing data or preprocessed state
  // IMPORANT make sure we do NOT mutate existingData or preProcessedState, or we are going to have a bad time
  // this took forever to find
  const input = produce(existingData ?? preProcessedState?.entityStructure ?? {}, (draft: any) => {
    // Apply previous values from preprocessed nodes
    if (preProcessedState?.nodes) {
      for (const [key, value] of Object.entries(preProcessedState.nodes)) {
        const prev = (value as any)?.previousValue;
        if (prev !== undefined) {
          const nestedPath = pathToNested(key, draft, true).split(".");
          set(draft, nestedPath, prev);
        }
      }
    }

    // Apply user values to the appropriate parent context
    const parent = data["@parent"];
    if (parent) {
      const nestedPath = pathToNested(parent, draft, true);
      const existing = get(draft, nestedPath.split("."));

      set(draft, nestedPath, {
        ...existing,
        ...userValues,
      });
    } else {
      Object.assign(draft, userValues);
    }
  });

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
  /** Enable experimental strict mode, which enforces null (uncertain) for values on screen */
  _experimental_strictMode?: boolean;
  apiManager: ApiManager | ApiManagerOptions;
  fileManager: FileManager | FileManagerOptions;
  init?: (manager: SessionManager) => void | Promise<void>;
  /**
   * @deprecated Use init instead. If init provided, this will be ignored.
   *
   * Will be removed in v1.0.0
   *
   * Legacy: Initial session config. If provided, will automatically start an interview on creation
   */
  sessionConfig?: SessionConfig;
  /** EXPERIMENTAL: trying out adding support to load/store sessions */
  sessionStore?: Storage;
  lifecycle?: ManagerLifecycleOptions;
  readOnly?: boolean;
}

export const updateReportingWithReplacements = (reporting: any, replacements: any, parent?: string) => {
  if (!reporting) return;

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

  // clone and normalise, to make sure we are using the same path system
  const result = normalizeIdBasedObject(structuredClone(reporting));
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

type StoredSessionConfig = SessionConfig;

const getClientGraphForSession = (session: Session) => {
  if (!session?.clientGraph && !session?.decompressedClientGraph) {
    return undefined;
  }

  if (!session.decompressedClientGraph) {
    session.decompressedClientGraph = decompressGraph(session.clientGraph);
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
  private sessionConfigs: Record<string, StoredSessionConfig>;
  readonly events: ManagerLifecycle;

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
    this.sessionConfigs = {};
    this.events = new ManagerLifecycle(options.lifecycle);

    // create the API manager
    this.apiManager =
      options.apiManager instanceof ApiManager
        ? options.apiManager
        : new ApiManager(options.apiManager as ApiManagerOptions);

    // create the file manager
    if (options.fileManager instanceof FileManager) {
      this.fileManager = options.fileManager;
    } else {
      const fm = options.fileManager as FileManagerOptions;
      // Attempt to inherit auth from the ApiManager options if not explicitly provided
      const apiAuth =
        options.apiManager instanceof ApiManager ? undefined : (options.apiManager as ApiManagerOptions)?.auth;

      if ("api" in fm) {
        this.fileManager = new FileManager(fm);
      } else {
        this.fileManager = new FileManager({
          ...fm,
          auth: fm.auth ?? apiAuth,
        });
      }
    }

    if (options.init) {
      try {
        options.init(this);
      } catch (error: any) {
        console.error(LogGroup, "Error during SessionManager init:", error);
        this.setState("error", error.response ?? error);
      };
    } else {
      // deprecated in favor of `init` which is given this instance
      // allows the consumer to create or load with whatever they want
      // auto start a session if sessionConfig is provided
      if (options.sessionConfig && this.sessions.length === 0) {
        const { sessionConfig } = options;
        this.log("Initializing session with config:", sessionConfig);
        this.create(sessionConfig).catch((error) => {
          console.error(LogGroup, "Error creating initial session:", error);
          this.setState("error", error.response ?? error);
        });
      }
    }

    // @ts-ignore
    this.serverSideDynamic = debounce(this.serverSideDynamic.bind(this), 1000);
  }

  private log = (message: string, ...args: any[]) => {
    if (this.isDebugEnabled()) {
      console.log(`[DEBUG:${LogGroup}] ${message}`, ...args);
    }
  };

  private setState = (state: ManagerState, error?: Error, source: ManagerLifecycleErrorSource = "init") => {
    this.state = state;
    this.error = error || undefined;
    this.log("State updated:", this.state, this.error);

    if (state === "error" && this.error) {
      this.events.emitError({
        manager: this,
        error: this.error,
        state: "error",
        source,
      });
    }

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

  push = (session: Session, source: ManagerLifecycleActiveSessionChangeSource = "push") => {
    const previousActiveSession = this.activeSession;
    this.sessions.push(session);
    this.active = this.sessions.length - 1; // always set active to the last session
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }

    this.events.emitActiveSessionChange({
      manager: this,
      activeSession: this.activeSession,
      previousActiveSession,
      activeIndex: this.active,
      source,
    });
  };

  pop = (source: ManagerLifecycleActiveSessionChangeSource = "pop") => {
    if (this.sessions.length === 0) return null;
    const previousActiveSession = this.activeSession;
    const session = this.sessions.pop();
    if (session) {
      this.deleteSessionConfig(session.sessionId);
    }
    this.active = this.sessions.length - 1; // set active to the last session
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }

    this.events.emitActiveSessionChange({
      manager: this,
      activeSession: this.activeSession,
      previousActiveSession,
      activeIndex: this.active,
      source,
    });

    return session;
  };

  /**
   * Store an isolated copy of the session config so later caller mutations do not
   * change the reset baseline for this session.
   */
  private setSessionConfig = (sessionId: string, config: SessionConfig) => {
    this.sessionConfigs[sessionId] = deepClone(config);
  };

  /**
   * Return a fresh copy of the stored session config so reset callers cannot mutate
   * the cached baseline that future resets depend on.
   */
  private getSessionConfig = (sessionId: string) => {
    const config = this.sessionConfigs[sessionId];
    return config ? deepClone(config) : undefined;
  };

  private deleteSessionConfig = (sessionId: string) => {
    delete this.sessionConfigs[sessionId];
  };

  setActive = (index: number) => {
    if (index < 0 || index >= this.sessions.length) {
      console.warn(LogGroup, `Invalid session index: ${index}. Must be between 0 and ${this.sessions.length - 1}`);
      return;
    }

    const previousActiveSession = this.activeSession;
    this.active = index;
    if (this.options.sessionStore) {
      this.options.sessionStore.set({
        sessions: this.sessions,
        active: this.active,
      });
    }

    this.events.emitActiveSessionChange({
      manager: this,
      activeSession: this.activeSession,
      previousActiveSession,
      activeIndex: this.active,
      source: "setActive",
    });
  };

  private handleClientGraphBookmark(session: Session) {
    if (session.clientGraphBookmark) {
      if (!session.clientGraph) {
        const bookmarkRaw = sessionStorage.getItem(BOOKMARK_KEY);
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
        sessionStorage.setItem(
          BOOKMARK_KEY,
          JSON.stringify({
            clientGraph: session.clientGraph,
            id: session.clientGraphBookmark,
          } satisfies ClientGraphBookmarkData),
        );
      }
    }
  }

  private createSession = async (
    config: SessionConfig,
    source: ManagerLifecycleSessionStartSource = "create",
  ): Promise<Session> => {
    try {
      this.log("Creating session:", config);
      this.setState("loading");
      const session = await this.apiManager.create({
        ...config,
        clientGraphBookmark: this.getClientGraphBookmark(),
        readOnly: this.options.readOnly,
      });
      this.setSessionConfig(session.sessionId, config);
      this.log("Session created successfully:", session);
      this.setState("success");
      this.push(session, source);
      this.updateSession(session, source);
      this.events.emitSessionStart({
        manager: this,
        session,
        config: this.getSessionConfig(session.sessionId) ?? deepClone(config),
        source,
      });
      // if we successfully created a session, try to pre-cache the client-side dynamic runtime
      this.preCacheClient();
      return session;
    } catch (error: any) {
      console.error(LogGroup, "Error creating session:", error);
      this.setState("error", error.response ?? error, source);
      // re-throw to allow caller to handle and respect promise interface
      throw error;
    }
  };

  create = async (config: SessionConfig): Promise<Session> => {
    return this.createSession(config, "create");
  };

  load = async (config: SessionConfig): Promise<Session> => {
    try {
      this.log("Loading session:", config);
      this.setState("loading");
      const session = await this.apiManager.load({
        ...config,
        clientGraphBookmark: this.getClientGraphBookmark(),
        readOnly: this.options.readOnly,
      });
      this.setSessionConfig(session.sessionId, config);
      this.log("Session loaded successfully:", session);
      this.setState("success");
      this.push(session, "load");
      this.updateSession(session, "load");
      this.events.emitSessionStart({
        manager: this,
        session,
        config: this.getSessionConfig(session.sessionId) ?? deepClone(config),
        source: "load",
      });
      // if we successfully created a session, try to pre-cache the client-side dynamic runtime
      this.preCacheClient();
      return session;
    } catch (error: any) {
      console.error(LogGroup, "Error loading session:", error);
      this.setState("error", error.response ?? error, "load");
      // re-throw to allow caller to handle and respect promise interface
      throw error;
    }
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
    } catch (error: any) {
      console.error(LogGroup, "Error creating sub-interview:", createOpts, error);
      this.setState("error", error.response ?? error, "createSubInterview");
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

  get parsedGraph() {
    if (!this.activeSession) {
      return null;
    }
    const raw = this.clientGraph;
    if (!raw) {
      return null;
    }
    return graphFromJSON(raw);
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

  templateText = (text: string, inputData: Record<string, any> = {}) => {
    if (!this.activeSession) return text;
    const { state, locale, data } = this.activeSession;
    return replaceTemplatedText(text, { ...this.internals.replacements, ...inputData }, data, state, locale);
  }

  // #region dynamic

  private triggerUpdate = (externalLoading: boolean) => {
    this.externalLoading = externalLoading;
    this.renderAt = Date.now();
    // update store
    this.options.sessionStore?.set({
      sessions: this.sessions,
      active: this.active,
    });
    this.log("Triggering update", { externalLoading });
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
        const hasUnknownsRequiringSimulate = Object.keys(this.internals.unknownsRequiringSimulate).length > 0;

        // If client-side dynamic runtime is available, always solve all dynamic goals.
        // unknownsRequiringSimulate is treated as a server-side queue only.
        if (this.clientGraph) {
          try {
            const result = await this.runRulesEngine();
            if (result?.reporting) {
              const replacements = createEntityPathedData({
                ...result.reporting.global,
                ...result.reporting,
                global: undefined,
              });
              this.log(`[${LogGroup}] Replacements':`, replacements);
              this.internals.replacements = replacements;

              // Keep server-side queue only for goals not solved client-side.
              for (const goal of Object.keys(this.internals.unknownsRequiringSimulate)) {
                if (this.internals.replacements[goal] !== undefined) {
                  delete this.internals.unknownsRequiringSimulate[goal];
                }
              }
            }

            // make sure we update the newScreen, as thats our working copy
            this.activeSession.validations = result?.validations;
          } catch (error) {
            console.error(`[${LogGroup}] Error solving goal "${this.activeSession.goal}" client-side:`, error);
            // surface error under validations, so the user knows something went wrong
            // this ideally blocks progress until resolved
            this.activeSession.validations = [{
              id: this.activeSession.goal,
              attributes: [],
              severity: "error",
              message: "An error occurred while processing your input. Please refresh and try again.",
              shown: true,
            }];
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
          (hasUnknownsRequiringSimulate || replacementQueries.sidebarSimulate?.ids?.length),
        );

        this.activeSession.screen = newScreen;
        this.updateSession(this.activeSession, "simulate");

        // Handle any remaining unknowns that require server-side simulation
        if (requiresServiceDynamic) {
          this.triggerUpdate(true);
          this.serverSideDynamic();
        } else {
          this.triggerUpdate(false);
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
      // ensure we set this back to false either way, so the loading state doesn't get stuck
      this.triggerUpdate(false);
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
        this.updateSession(result, "simulate");

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

    // ensure we set this back to false either way, so the loading state doesn't get stuck
    this.triggerUpdate(false);
  };

  /** NOTE Will run notifyListeners if changes occured */
  private updateSession = (session: Session, source: ManagerLifecycleSessionUpdateSource = "simulate") => {
    const prevSession = this.session;
    const previousActiveSession = this.activeSession;
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
    this.events.emitSessionUpdate({
      manager: this,
      session,
      previousSession: previousActiveSession,
      source,
    });

    // hasn't updated, force it
    if (currentRenderAt === this.renderAt) {
      this.triggerUpdate(false);
    }
  };

  private getClientGraphBookmark() {
    const bookmarkRaw = sessionStorage.getItem(BOOKMARK_KEY);
    if (bookmarkRaw) {
      return (JSON.parse(bookmarkRaw) as ClientGraphBookmarkData).id;
    }
    return undefined;
  }

  // #endregion

  // public methods

  /** Submit data and optionally navigate to a different screen */
  submit = async (data: AttributeValues, navigate?: any, overrides: Overrides = {}) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to submit data");
      return Promise.resolve(null);
    }
    this.triggerUpdate(true);
    try {
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
      this.updateSession(session, "submit");
    } catch (error: any) {
      console.error(LogGroup, "Error submitting data:", error);
      this.setState("error", error.response ?? error, "submit");
      throw error;
    } finally {
      this.triggerUpdate(false);
      return this;
    }
  };

  /** Save the current session data, without navigating */
  save = async (data: AttributeValues, overrides: Overrides = {}) => {
    // this is just submit, with navigate set to the current screen
    // so just invoke submit with navigate set to current screen id
    return this.submit(data, this.activeSession?.screen.id, overrides);
  }

  /** @experimental Generative AI chat is in exploration phase */
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
      this.triggerUpdate(true);
      const payload = await this.apiManager.chat({
        session: this.activeSession,
        message,
        goal,
        overrides,
        interactionId,
      });
      return payload;
    } catch (error) {
      throw error;
    } finally {
      this.triggerUpdate(false);
    }
  };

  /** Navigate to a specific step */
  navigate = async (step: StepId) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to navigate from");
      throw new Error("No active session to navigate from");
    }
    this.triggerUpdate(true);
    try {
      this.updateSession(
        await this.apiManager.navigate({
          session: this.activeSession,
          step,
          readOnly: this.options.readOnly,
        }),
        "navigate",
      );
    } catch (error: any) {
      console.error(LogGroup, "Error navigating to step:", error);
      this.setState("error", error.response ?? error, "navigate");
      throw error;
    } finally {
      this.triggerUpdate(false);
      return this;
    }
  };

  /** Navigate back to the previous step */
  back = async () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to go back from");
      throw new Error("No active session to go back from");
    }
    this.triggerUpdate(true);
    try {
      if (this.isSubInterview && isFirstStep(this.activeSession.steps, this.activeSession.screen.id)) {
        // pop the session, then we will invoke back on the parent
        this.pop("pop");
      }
      this.updateSession(
        await this.apiManager.back({
          session: this.activeSession,
          readOnly: this.options.readOnly,
        }),
        "back",
      );
    } catch (error: any) {
      console.error(LogGroup, "Error going back:", error);
      this.setState("error", error.response ?? error, "back");
      throw error;
    } finally {
      this.triggerUpdate(false);
      return this;
    }
  };

  /** Navigate to the next step with the provided data */
  next = async (data: AttributeValues) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to next data");
      throw new Error("No active session to next data");
    }
    this.triggerUpdate(true);
    try {
      if (this.isSubInterview && isComplete(this.activeSession)) {
        // pop the session, then we will invoke next on the parent
        this.pop("pop");
      }
      this.updateSession(
        await this.apiManager.submit({
          session: this.activeSession,
          data: transformResponse(this.activeSession, data as any),
          overrides: {
            // response: this.options.responseElements,
          },
          clientGraphBookmark: this.getClientGraphBookmark(),
          readOnly: this.options.readOnly,
        }),
        "next",
      );
    } catch (error: any) {
      console.error(LogGroup, "Error submitting data on next:", error);
      this.setState("error", error.response ?? error, "next");
      throw error;
    } finally {
      this.triggerUpdate(false);
      return this;
    }
  };

  exportTimeline = () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to export timeline from");
      throw new Error("No active session to export timeline from");
    }
    return this.apiManager.exportTimeline({ session: this.activeSession });
  };

  downloadTimeline = async (fileName?: string) => {
    const timeline = await this.exportTimeline();
    if (!timeline) {
      throw new Error("No active session to export timeline from");
    }

    if (typeof document === "undefined") {
      throw new Error("Timeline download requires a browser environment");
    }

    const blob = new Blob([timeline], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");

    try {
      element.href = url;
      element.download = fileName ?? `Sequence - ${this.activeSession?.interviewId || "Interview"} (${new Date().toISOString()}).json`;
      document.body.appendChild(element);
      element.click();
    } catch (error) {
      throw error;
    } finally {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      URL.revokeObjectURL(url);
    }
  };

  reset = async (config?: SessionConfig) => {
    const session = this.activeSession;
    const resetConfig = config ?? (session ? this.getSessionConfig(session.sessionId) : undefined);

    if (!resetConfig) {
      throw new Error("No session config available to reset");
    }

    this.pop("reset");
    return this.createSession(resetConfig, "reset");
  };

  get getConnectedData() {
    return this.apiManager.getConnectedData;
  }

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
