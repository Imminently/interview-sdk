import debounce from "lodash/debounce.js";
import isEmpty from "lodash/isEmpty.js";
import isEqual from "lodash/isEqual.js";
import set from "lodash/set.js";
import { SESSION_BACKEND_BRAND, type SessionBackend } from "./backend/backend";
import {
  RemoteSessionBackend,
  type RemoteSessionBackendOptions,
} from "./backend/remote-backend";
// import { back, chat, create, exportTimeline, load, navigate, postSimulate, submit } from "./api";
import { type SidebarSimulate, requiresSimulation } from "./dynamic";
import { FileManager, type FileManagerOptions } from "./file-manager";
import {
  ManagerLifecycle,
  type ManagerLifecycleActiveSessionChangeSource,
  type ManagerLifecycleErrorSource,
  type ManagerLifecycleOptions,
  type ManagerLifecycleSessionStartSource,
  type ManagerLifecycleSessionUpdateSource,
} from "./manager-events";
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
  NavigateTarget,
} from "./types";
import {
  createEntityPathedData,
  deepClone,
  flattenObject,
  iterateControls,
  postProcessControl,
  transformResponse,
} from "./util";
import { replaceTemplatedText } from "./helpers";
import { decompressGraph, graphFromJSON } from "./graphUtil";
import { type GeneratePlaywrightTestOptions, exportTransformTimeline, generatePlaywrightTestCode } from "./playwright-test-generator";
import { constructInputFromPreProcessed } from "./dynamic/constructInput";

const BOOKMARK_KEY = "immi_cg_bookmark_3";

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
  /**
   * Enables debug mode. When true, mounts debug infrastructure and allows
   * debug to be toggled at runtime. Debug starts disabled — use
   * `setDebugEnabled(true)` or the Ctrl+D keyboard shortcut (in the UI) to
   * activate it.
   */
  debug?: boolean;
  /**
   * If true, will pre-load/cache client side dynamic runtime.
   * Note requires an initial sessionConfig to be provided.
   */
  preCacheClient?: boolean;
  /** Enable experimental strict mode, which enforces null (uncertain) for values on screen */
  _experimental_strictMode?: boolean;
  backend?: SessionBackend | RemoteSessionBackendOptions;
  /** @deprecated Use `backend` instead. */
  apiManager?: SessionBackend | RemoteSessionBackendOptions;
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

export interface CloneOptions {
  session?: Session;
  backend?: SessionBackend | RemoteSessionBackendOptions;
}

export type SessionManagerCloneOptions = CloneOptions;

declare global {
  interface Window {
    __INTERVIEW_HARNESS_CAPTURE_CLIENT_SOLVE__?: boolean;
    __INTERVIEW_HARNESS_LAST_CLIENT_SOLVE_RESPONSE__?: any;
    __INTERVIEW_HARNESS_CLIENT_SOLVE_PROMISE__?: Promise<{ response: any | null; error?: any }>;
    __INTERVIEW_HARNESS_RESOLVE_CLIENT_SOLVE__?: (result: { response: any | null; error?: any }) => void;
  }
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
  // BUGFIX: set the value either way, I don't understand why we wouldn't want a new value
  for (const [key, value] of Object.entries(flattened)) {
    const path = key.split("/");
    // if (get(result, path) !== undefined) {
    set(result, path, value);
    // }
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

const looksLikeEvent = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    ("preventDefault" in value || "stopPropagation" in value) &&
    ("target" in value || "currentTarget" in value || "nativeEvent" in value)
  );
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
  private backend: SessionBackend;
  private fileManager: FileManager;
  private snapCache?: SessionSnapshot;
  private sessionConfigs: Record<string, StoredSessionConfig>;
  readonly events: ManagerLifecycle;

  private debugEnabled: boolean;
  private advancedDebugEnabled: boolean;
  private _disableDynamic: boolean = false;

  private renderAt: number = Date.now();
  private externalLoading = false;
  private rulesEnginePromise: Promise<RulesEngine> | undefined = undefined;

  private internals: SessionInternal = {
    userValues: {},
    prevUserValues: {},
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
    this.debugEnabled = false;
    this.advancedDebugEnabled = false;
    this.sessionConfigs = {};
    this.events = new ManagerLifecycle(options.lifecycle);

    const backendOption = options.backend ?? options.apiManager;
    if (!backendOption) {
      throw new Error("SessionManager requires a backend");
    }

    const isSessionBackend = (backend: typeof backendOption): backend is SessionBackend =>
      (backend as SessionBackend)[SESSION_BACKEND_BRAND] === true;

    const isRemoteSessionBackendOptions = (backend: typeof backendOption): backend is RemoteSessionBackendOptions =>
      typeof (backend as RemoteSessionBackendOptions).host === "string";

    this.backend = isSessionBackend(backendOption)
      ? backendOption
      : new RemoteSessionBackend(backendOption as RemoteSessionBackendOptions);

    // create the file manager
    if (options.fileManager instanceof FileManager) {
      this.fileManager = options.fileManager;
    } else {
      const fm = options.fileManager as FileManagerOptions;
      // Attempt to inherit auth from the ApiManager options if not explicitly provided
      const apiAuth = isRemoteSessionBackendOptions(backendOption) ? backendOption.auth : undefined;

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

  isDynamicDisabled = () => this._disableDynamic;

  setDisableDynamic = (disabled: boolean) => {
    this._disableDynamic = disabled;
  };

  private preCacheClient = () => {
    // try to pre-cache the client-side dynamic runtime
    if (this.options.preCacheClient && this.clientGraph && !this.rulesEnginePromise) {
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

  /** @deprecated Use `backend` configuration instead. */
  get apiManager() {
    return this.backend;
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

  private getSessionOverrides = (sessionId: string, overrides: Overrides = {}) => {
    const storedConfig = this.getSessionConfig(sessionId);
    if (Object.prototype.hasOwnProperty.call(overrides, "response")) {
      return { ...overrides };
    }

    if (storedConfig?.response === undefined) {
      return { ...overrides };
    }

    return {
      ...overrides,
      response: deepClone(storedConfig.response),
    };
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

  clone = (options: SessionManagerCloneOptions = {}) => {
    const session = options.session ?? this.activeSession;
    if (!session) {
      throw new Error("SessionManager.clone requires a session");
    }

    const backendOption = options.backend ?? this.backend;
    const isSessionBackend = (backend: typeof backendOption): backend is SessionBackend =>
      (backend as SessionBackend)[SESSION_BACKEND_BRAND] === true;
    const backend = isSessionBackend(backendOption)
      ? backendOption
      : new RemoteSessionBackend(backendOption as RemoteSessionBackendOptions);

    const cloneOptions: ManagerOptions = {
      ...this._options,
      backend,
      apiManager: undefined,
      fileManager: this.fileManager,
      init: undefined,
      sessionConfig: undefined,
      sessionStore: undefined,
    };
    const manager = new SessionManager(cloneOptions);
    const clonedSession = deepClone(session);
    manager.sessions = [clonedSession];
    manager.active = 0;
    manager.state = "success";
    manager.error = undefined;
    manager.debugEnabled = this.debugEnabled;
    manager.advancedDebugEnabled = this.advancedDebugEnabled;
    manager._disableDynamic = this._disableDynamic;
    const config = this.getSessionConfig(session.sessionId);
    if (config) {
      manager.setSessionConfig(clonedSession.sessionId, config);
    }
    return manager;
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
      const session = await this.backend.create({
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
    this.log("create:", config);
    return this.createSession(config, "create");
  };

  load = async (config: SessionConfig): Promise<Session> => {
    try {
      this.log("Loading session:", config);
      this.setState("loading");
      const session = await this.backend.load({
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
    if (this._disableDynamic) return;
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
    return replaceTemplatedText(text, { ...inputData }, data, state, locale);
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

  /**
   * Runs the client-side rules engine to calculate dynamic values and screen updates.
   * Returns the result of the rules engine solve, or null if it cannot be run (e.g. no active session or client graph).
   */
  async runRulesEngine(debug?: boolean): Promise<any | null> {
    if (!this.activeSession || !this.clientGraph) {
      return null;
    }
    if (typeof window !== "undefined" && window.__INTERVIEW_HARNESS_CAPTURE_CLIENT_SOLVE__) {
      window.__INTERVIEW_HARNESS_CLIENT_SOLVE_PROMISE__ = new Promise((resolve) => {
        window.__INTERVIEW_HARNESS_RESOLVE_CLIENT_SOLVE__ = resolve;
      });
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
      // no goals to solve, ie we don't need to run client side
      // running it will cause an error
      return null;
    }

    const goal = roots[0];
    this.log(`[${LogGroup}] Release:`, release);
    this.log(`[${LogGroup}] Payload:`, {
      "@goal": goal,
      "@root": roots,
      ...input,
    });

    let result: any;
    try {
      result = await rulesEngine.solve(
        {
          input: input,
          roots: roots,
          goal: goal,
          response_elements: [
            {
              type: "attributes",
              ids: roots.map((path) => path.split("/").pop()),
            },
            {
              type: "screenUpdate",
              screen,
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
          getRelease: () => release,
        },
        {},
      );

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error(LogGroup, "Rules engine failed to solve:", error);
      this.setState("error", new Error("Rules engine failed to solve"));
      if (typeof window !== "undefined" && window.__INTERVIEW_HARNESS_CAPTURE_CLIENT_SOLVE__) {
        window.__INTERVIEW_HARNESS_LAST_CLIENT_SOLVE_RESPONSE__ = null;
        window.__INTERVIEW_HARNESS_RESOLVE_CLIENT_SOLVE__?.({ response: null, error });
      }
      throw error;
    }

    this.log(`[${LogGroup}] Calculated':`, structuredClone(result));

    if (typeof window !== "undefined" && window.__INTERVIEW_HARNESS_CAPTURE_CLIENT_SOLVE__) {
      window.__INTERVIEW_HARNESS_LAST_CLIENT_SOLVE_RESPONSE__ = result;
      window.__INTERVIEW_HARNESS_RESOLVE_CLIENT_SOLVE__?.({ response: result });
    }

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
        // If client-side dynamic runtime is available, always solve all dynamic goals.
        if (this.clientGraph) {
          try {
            const clientDynamicResult = await this.runRulesEngine(
              typeof window !== "undefined" && window.__INTERVIEW_HARNESS_CAPTURE_CLIENT_SOLVE__,
            );

            if(clientDynamicResult === null) {
              this.log("Skipping client-side dynamic update. Either not needed or due to missing goals or client graph.");
              return;
            }

            if (!clientDynamicResult?.screen) {
              throw new Error("Client dynamic solve did not return a screen");
            }

            this.activeSession.screen = clientDynamicResult.screen;
            this.activeSession.reporting = clientDynamicResult.reporting;
            this.activeSession.validations = clientDynamicResult?.validations;
            if (clientDynamicResult.state) {
              this.activeSession.state = clientDynamicResult.state;
            }
            this.updateSession(this.activeSession, "simulate");
            this.triggerUpdate(false);
            this.internals.prevUserValues = structuredClone(this.internals.userValues);
            return;
          } catch (error) {
            console.error(LogGroup, "Client-side dynamic:", error);
            const message = error instanceof Error && error.message
              ? error.message
              : "An error occurred while processing your input. Please refresh and try again.";
            this.activeSession.validations = [{
              id: this.activeSession.goal,
              attributes: [],
              severity: "error",
              message,
              shown: true,
            }];
            this.updateSession(this.activeSession, "simulate");
            this.triggerUpdate(false);
            this.internals.prevUserValues = structuredClone(this.internals.userValues);
            return;
          }
        }

        this.updateSession({
          ...this.activeSession,
          screen: this.makeScreenCopy(),
        }, "simulate");
        this.triggerUpdate(true);
        this.serverSideDynamic();
        this.internals.prevUserValues = structuredClone(this.internals.userValues);
        return;
      }
    }
    this.internals.prevUserValues = structuredClone(this.internals.userValues);
  };

  private loadRulesEngine = async (): Promise<RulesEngine> => {
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to load rules engine");
      throw new Error("No active session to load rules engine");
    }
    try {
      if (this.backend.getRulesEngineRuntime) {
        return await this.backend.getRulesEngineRuntime({ checksum: this.activeSession.rulesEngineChecksum });
      }

      const engine = await this.backend.getRulesEngine({ checksum: this.activeSession.rulesEngineChecksum });
      // biome-ignore lint: https://esbuild.github.io/content-types/#direct-eval
      return (0, eval)(engine);
    } catch (error: any) {
      console.error(LogGroup, "Rules engine failed to load:", error);
      const wrappedError = new Error("Rules engine failed to load");
      this.setState("error", wrappedError);
      throw wrappedError;
    }
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

    if (!requiresSimulation(this.activeSession, this.internals.userValues)) {
      this.triggerUpdate(false);
      return;
    }

    const requestId = this.internals.latestRequest;

    const result = await this.backend.simulate({
      session: this.activeSession,
      payload: {
        goal: this.activeSession.goal,
        response: [
          {
            type: "screenUpdate",
            screen: this.activeSession.screen,
          },
        ],
        data: {
          "@parent": this.activeSession.data["@parent"],
          ...(this.internals.userValues as any),
        },
      },
    });

    // are we still the last request?
    if (this.internals.latestRequest !== requestId) {
      return;
    }

    if (!result.screen) {
      throw new Error("Server dynamic solve did not return a screen");
    }

    const newScreen = result.screen;
    this.updateSession({
      ...this.activeSession,
      ...result,
      data: this.activeSession.data,
      screen: newScreen,
    }, "simulate");

    if (newScreen) {
      const nextButton = newScreen.buttons?.next;
      if (nextButton && typeof nextButton === "object") {
        this.internals.canProgress = nextButton.dependencies.every(
          (attr) => (this.internals.userValues[attr] || this.activeSession?.state?.find((s) => s.id === attr)?.value) === true,
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
      if (prevSession?.screen?.id !== session.screen?.id) {
        const nextButton = session.screen.buttons?.next;
        let canProgress = true;
        if (nextButton && typeof nextButton === "object") {
          canProgress = nextButton.defaultEnabled;
        }

        this.internals = {
          userValues: {},
          prevUserValues: {},
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
  submit = async (
    data: AttributeValues,
    navigate?: any,
    overrides: Overrides = {},
  ) => {
    this.log("submit:", data, navigate, overrides);
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to submit data");
      return Promise.resolve(null);
    }
    this.triggerUpdate(true);
    try {
      const session = await this.backend.submit({
        session: this.activeSession,
        data: transformResponse(this.activeSession, data as any),
        navigate,
        overrides: this.getSessionOverrides(this.activeSession.sessionId, overrides),
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
    const activeSession = this.activeSession as (Session & { current_step?: string; currentStep?: string }) | null;
    return this.submit(data, activeSession?.current_step ?? activeSession?.currentStep ?? activeSession?.screen.id, overrides);
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
      const payload = await this.backend.chat({
        session: this.activeSession,
        message,
        goal,
        overrides: this.getSessionOverrides(this.activeSession.sessionId, overrides),
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
  navigate = async (step: NavigateTarget, overrides: Overrides = {}) => {
    this.log("navigate:", step, overrides);
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to navigate from");
      throw new Error("No active session to navigate from");
    }
    this.triggerUpdate(true);
    try {
      this.updateSession(
        await this.backend.navigate({
          session: this.activeSession,
          step,
          overrides: this.getSessionOverrides(this.activeSession.sessionId, overrides),
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
  back = async (overrides: Overrides = {}) => {
    this.log("back:", overrides);
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
        await this.backend.back({
          session: this.activeSession,
          overrides: this.getSessionOverrides(this.activeSession.sessionId, overrides),
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
  next = async (data: AttributeValues, overrides: Overrides = {}) => {
    this.log("next:", data, overrides);
    if (!this.activeSession) {
      console.warn(LogGroup, "No active session to next data");
      throw new Error("No active session to next data");
    }
    if (looksLikeEvent(overrides)) {
      throw new Error(
        "SessionManager.next received an event as its second argument. This usually happens when passing manager.next directly to react-hook-form handleSubmit. Wrap it instead, for example: handleSubmit((data) => manager.next(data)).",
      );
    }
    this.triggerUpdate(true);
    try {
      if (this.isSubInterview && isComplete(this.activeSession)) {
        // pop the session, then we will invoke next on the parent
        this.pop("pop");
      }
      this.updateSession(
        await this.backend.submit({
          session: this.activeSession,
          data: transformResponse(this.activeSession, data as any),
          overrides: this.getSessionOverrides(this.activeSession.sessionId, overrides),
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
    return this.backend.exportTimeline({ session: this.activeSession });
  };

  downloadTimeline = async (fileName?: string) => {
    const timeline = await this.exportTimeline();
    if (!timeline) {
      throw new Error("No active session to export timeline from");
    }

    if (typeof document === "undefined") {
      throw new Error("Timeline download requires a browser environment");
    }

    const blob = new Blob([JSON.stringify(exportTransformTimeline(timeline), null, 2)], { type: "application/json;charset=utf-8" });
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

  generatePlaywrightTest = async (): Promise<string> => {
    const session = this.activeSession;
    if (!session) {
      throw new Error("No active session to generate test from");
    }
    const timeline = await this.exportTimeline();
    const config = this.getSessionConfig(session.sessionId);
    const options: GeneratePlaywrightTestOptions = {
      project: session.model,
      release: session.release,
      timeline,
      initialData: config?.initialData as Record<string, unknown> | undefined,
    };
    return generatePlaywrightTestCode(options);
  };

  downloadPlaywrightTest = async (fileName?: string): Promise<void> => {
    if (typeof document === "undefined") {
      throw new Error("Playwright test download requires a browser environment");
    }
    const session = this.activeSession;
    const testCode = await this.generatePlaywrightTest();
    const blob = new Blob([testCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    try {
      element.href = url;
      element.download = fileName ?? `interview-${session?.interviewId || "test"} (${new Date().toISOString()}).spec.ts`;
      document.body.appendChild(element);
      element.click();
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
    return this.backend.getConnectedData;
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
