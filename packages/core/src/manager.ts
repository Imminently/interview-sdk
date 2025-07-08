import set from "lodash-es/set";
import get from "lodash-es/get";
import isEmpty from "lodash-es/isEmpty";
import isEqual from "lodash-es/isEqual";
import debounce from "lodash-es/debounce";
import pako from "pako";
import {
  type AttributeValues,
  type ChatResponse, InterviewContainerControl,
  type Overrides, RulesEngine, type Screen,
  type Session,
  type SessionConfig, Step, type StepId
} from "./types";
// import { back, chat, create, exportTimeline, load, navigate, postSimulate, submit } from "./api";
import { type SidebarSimulate, type UnknownValues, buildDynamicReplacementQueries, simulate } from "./dynamic";
import { SIDEBAR_DYNAMIC_DATA_INFO } from "./sidebars/sidebar";
import { deepClone, iterateControls, pathToNested, postProcessControl, transformResponse } from "./util";
import { FileManager, FileManagerOptions } from "./file-manager";
import { ApiManager, ApiManagerOptions } from "./api-manager";

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
}

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
  private debug: boolean;
  private listeners: Set<() => void>;
  private options: ManagerOptions;
  private apiManager: ApiManager;
  private fileManager: FileManager;
  private snapCache?: SessionSnapshot;

  private renderAt: number = Date.now();
  private externalLoading = false;
  private rulesEnginePromise: Promise<RulesEngine> | undefined = undefined;
  private processedScreen: Screen | undefined;
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
    this.sessions = [];
    this.active = 0;
    this.state = "loading";
    this.error = undefined;
    this.options = options;
    this.debug = Boolean(options.debug);
    this.listeners = new Set();

    // create the API manager
    this.apiManager = options.apiManager instanceof ApiManager
      ? options.apiManager
      : new ApiManager(options.apiManager as ApiManagerOptions);

    // create the file manager
    this.fileManager = options.fileManager instanceof FileManager
      ? options.fileManager
      : new FileManager(options.fileManager as FileManagerOptions);

    // auto start a session if sessionConfig is provided
    if (options.sessionConfig) {
      const { sessionConfig } = options;
      this.log("Initializing session with config:", sessionConfig);
      this.create(sessionConfig)
        .then(() => {
          // if we successfully created a session, set the state to success
          if (options.preCacheClient) {
            this.log("Pre-caching client-side dynamic runtime");
            this.rulesEnginePromise = this.loadRulesEngine();
          }
        })
        .catch((error) => {
          console.error(LogGroup, "Error creating initial session:", error);
          this.setState("error", error as Error);
        });
    }

    // @ts-ignore
    this.serverSideDynamic = debounce(this.serverSideDynamic.bind(this), 1000);
  }

  private log = (message: string, ...args: any[]) => {
    if (this.debug) {
      console.log(`[DEBUG:${LogGroup}] ${message}`, ...args);
    }
  };

  private setState = (state: ManagerState, error?: Error) => {
    this.state = state;
    this.error = error || undefined;
    this.log("State updated:", this.state, this.error);
    this.notifyListeners();
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

  push = (session: Session) => {
    this.sessions.push(session);
    this.active = this.sessions.length - 1; // always set active to the last session
  }

  pop = () => {
    if (this.sessions.length === 0) return null;
    const session = this.sessions.pop();
    this.active = this.sessions.length - 1; // set active to the last session
    return session;
  }

  setActive = (index: number) => {
    if (index < 0 || index >= this.sessions.length) {
      console.warn(LogGroup, `Invalid session index: ${index}. Must be between 0 and ${this.sessions.length - 1}`);
      return;
    }
    this.active = index;
  }

  create = async (config: SessionConfig): Promise<Session> => {
    this.log("Creating session:", config);
    this.setState("loading");
    const session = await this.apiManager.create(config);
    this.log("Session created successfully:", session);
    this.setState("success");
    this.push(session);
    this.updateSession(session);
    return session;
  }

  load = async (config: SessionConfig): Promise<Session> => {
    this.log("Loading session:", config);
    this.setState("loading");
    const session = await this.apiManager.load(config);
    this.log("Session loaded successfully:", session);
    this.setState("success");
    this.push(session);
    this.updateSession(session);
    return session;
  }

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
    } catch (error) {
      console.error(LogGroup, "Error creating sub-interview:", createOpts, error);
      this.setState("error", error as Error);
    }
  }

  subscribe = (callback: () => void): () => void => {
    this.log("Subscribing to session updates");
    this.listeners.add(callback);
    return () => {
      this.log("Unsubscribing from session updates");
      this.listeners.delete(callback);
    }
  }

  getSnapshot = (): SessionSnapshot => {
    // debugger;
    const snap = {
      state: this.state,
      error: this.error,
      loading: this.externalLoading,
      session: this.session ? { ...this.session, screen: this.processedScreen ?? this.session?.screen } as Session : null,
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
  }

  notifyListeners = () => {
    this.log("Notifying listeners of session update", this.session);
    for (const listener of this.listeners) {
      listener();
    }
  }

  onScreenDataChange = (data: AttributeValues) => {
    this.log("Screen data changed:", data);
    Object.assign(this.internals.userValues, data);
    this.clientSideDynamic();
  }

  // -- session getters

  get clientGraph() {
    if (!this.activeSession?.clientGraph) {
      return undefined;
    }

    const session = this.activeSession as Session;
    if (session.decompressedClientGraph) {
      return session.decompressedClientGraph;
    }

    // @ts-ignore string should work
    const decompressed = JSON.parse(pako.inflate(session.clientGraph, { to: "string" }));
    return (session.decompressedClientGraph = decompressed);
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
  }

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
    this.processedScreen = screen ?? this.processedScreen;
    this.renderAt = Date.now();

    this.log("Triggering update", update);
    this.notifyListeners();
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

        if (Object.keys(this.internals.unknownsRequiringSimulate).length > 0) {
          const newScreen = this.makeScreenCopy();
          iterateControls(newScreen.controls, (control: any) => {
            if (control.dynamicAttributes && Object.keys(this.internals.unknownsRequiringSimulate).length > 0) {
              if (
                control.dynamicAttributes.some((dynamic: string) => this.internals.unknownsRequiringSimulate[dynamic])
              ) {
                control.loading = true;
              }
            }
            if (!control.loading) {
              postProcessControl(control, this.internals.replacements, data, state, locale);
            }
          });

          this.triggerUpdate({
            externalLoading: true,
            screen: newScreen,
          });

          // Get all goals that need to be solved
          const goalsToSolve = Object.keys(this.internals.unknownsRequiringSimulate);

          // Handle client-side calculations first
          if (goalsToSolve.length > 0 && this.clientGraph) {
            if (!this.rulesEnginePromise) {
              this.rulesEnginePromise = this.loadRulesEngine();
            }

            // reconstruct the entity structure from the preprocessed state
            const input = this.activeSession.preProcessedState?.entityStructure ?? {};
            const parent = data["@parent"];
            if (this.activeSession.preProcessedState?.nodes) {
              for (const [key, value] of Object.entries(this.activeSession.preProcessedState.nodes)) {
                const prev = (value as any)?.previousValue;
                if (prev !== undefined) {
                  const nestedPath = pathToNested(key, input, true).split(".");
                  set(input, nestedPath, prev);
                }
              }
            }

            if (parent) {
              const nestedPath = pathToNested(parent, input, true).split(".");
              const existing = get(input, nestedPath);
              set(input, pathToNested(parent, input, true), { ...existing, ...this.internals.userValues });
            } else {
              Object.assign(input, this.internals.userValues);
            }

            const rulesEngine = await this.rulesEnginePromise;
            for (const goal of goalsToSolve) {
              try {
                const result = await rulesEngine.solve(
                  {
                    input: input,
                    goal: goal,
                  },
                  screen.id,
                  {
                    getRelease: () => {
                      return {
                        relationships: this.activeSession!.relationships || [],
                        rule_graph: this.clientGraph,
                      };
                    },
                  },
                  this.activeSession.preProcessedState,
                );

                //if (result.result !== undefined) {
                // Update replacements with solved values
                Object.assign(this.internals.replacements, {
                  [goal]: result.result,
                });

                // Remove from unknowns requiring simulate since it's been handled client-side
                delete this.internals.unknownsRequiringSimulate[goal];
                //} else {
                //  console.log(result);
                //}
              } catch (error) {
                console.error(`[${LogGroup}] Error solving goal "${goal}" client-side:`, error);
              }
            }
            console.log(this.internals.unknownsRequiringSimulate, this.internals.replacements);

            // Update screen with new values
            if (newScreen?.controls) {
              iterateControls(newScreen.controls, (control: any) => {
                if (control.loading) {
                  control.loading = undefined;
                }
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

          this.internals.sidebarSimulate = replacementQueries.sidebarSimulate;
          if (newScreen.sidebars) {
            for (const sidebar of newScreen.sidebars) {
              if (sidebar.id) {
                sidebar.loading = this.internals.sidebarSimulate?.ids.includes(sidebar.id);
              }
            }
          }

          const requiresServiceDynamic = Boolean(Object.keys(this.internals.unknownsRequiringSimulate).length > 0 || replacementQueries.sidebarSimulate?.ids?.length);

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
    }
    this.internals.prevUserValues = structuredClone(this.internals.userValues);
  }

  private loadRulesEngine = async (): Promise<RulesEngine> => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to load rules engine");
      throw new Error("No active session to load rules engine");
    }
    const engine = await this.apiManager.getRulesEngine(this.activeSession.rulesEngineChecksum);
    // biome-ignore lint: https://esbuild.github.io/content-types/#direct-eval
    return (0, eval)(engine);
  }

  private makeScreenCopy = () => {
    return deepClone(this.processedScreen ? this.processedScreen : this.activeSession!.screen);
  }

  // this function is debounced
  private serverSideDynamic = async () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to process server-side dynamic values");
      return;
    }
    let newScreen: Screen | undefined = undefined;
    const { state, locale, data, screen } = this.activeSession;
    if (Object.keys(this.internals.unknownsRequiringSimulate).length > 0 && this.activeSession.screen) {
      const requestId = this.internals.latestRequest;

      const result = await simulate(Object.values(this.internals.unknownsRequiringSimulate), this.apiManager, this.activeSession);

      // are we still the last request?
      if (this.internals.latestRequest === requestId) {
        newScreen = this.makeScreenCopy();

        // ask the backend to solve for any dynamic attributes, based on the entered attributes
        Object.assign(this.internals.replacements, result);

        this.log("Got replacements:", JSON.stringify(newScreen.controls, null, 2), this.internals.replacements);

        // replace anything replaceable on the screen
        if (newScreen?.controls) {
          iterateControls(newScreen.controls, (control: any) => {
            if (control.loading) {
              control.loading = undefined;
            }
            postProcessControl(control, this.internals.replacements, data, state, locale);
          });
        }

        this.internals.unknownsAlreadySimulated = { ...this.internals.unknownsRequiringSimulate };
        this.internals.unknownsRequiringSimulate = {};
      }
    }

    this.log('Simulate sidebar?', this.internals.sidebarSimulate);

    if (this.internals.sidebarSimulate) {
      const result = await this.apiManager.simulate(this.activeSession, this.internals.sidebarSimulate.simulate);
      for (const sidebarId of this.internals.sidebarSimulate.ids) {
        if (!newScreen) {
          newScreen = this.makeScreenCopy();
        }

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

    const nextButton = screen.buttons?.next;
    if (nextButton && typeof nextButton === "object") {
      this.internals.canProgress = nextButton.dependencies.every(
        (attr) => (this.internals.userValues[attr] || this.internals.replacements[attr]) === true,
      );
    }

    if (newScreen) {
      this.triggerUpdate({
        externalLoading: false,
        screen: newScreen,
      });
    }
  }

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

    // hasn't updated, force it
    if (currentRenderAt === this.renderAt) {
      this.triggerUpdate({
        screen: session.screen,
      });
    }
  }

  // public methods

  submit = async (data: AttributeValues, navigate?: any, overrides: Overrides = {}) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to submit data");
      return Promise.resolve(null);
    }
    this.triggerUpdate({ externalLoading: true });
    this.updateSession(
      await this.apiManager.submit(this.activeSession, transformResponse(this.activeSession, data as any), navigate, {
        // response: this.options.responseElements,
        ...overrides,
      }),
    );
    this.triggerUpdate({ externalLoading: false });
    return this;
  }

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
      const payload = await this.apiManager.chat(this.activeSession, message, goal, overrides, interactionId);
      this.triggerUpdate({ externalLoading: false });
      return payload;
    } catch (error) {
      this.triggerUpdate({ externalLoading: false });
      throw error;
    }
  }

  navigate = async (step: StepId) => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to navigate from");
      throw new Error("No active session to navigate from");
    }
    this.triggerUpdate({ externalLoading: true });
    this.updateSession(await this.apiManager.navigate(this.activeSession, step));
    this.triggerUpdate({ externalLoading: false });
    return this;
  }

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
    this.updateSession(await this.apiManager.back(this.activeSession));
    this.triggerUpdate({ externalLoading: false });
    return this;
  }

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
      await this.apiManager.submit(this.activeSession, transformResponse(this.activeSession, data as any), false, {
        // response: this.options.responseElements,
      }),
    );
    this.triggerUpdate({ externalLoading: false });
    return this;
  }

  exportTimeline = () => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to export timeline from");
      throw new Error("No active session to export timeline from");
    }
    return this.apiManager.exportTimeline(this.activeSession);
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
