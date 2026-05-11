import type { Session, SessionConfig } from "./types";
import type { SessionManager } from "./manager";

const LogGroup = "ManagerLifecycle";

export type ManagerLifecycleSessionStartSource = "create" | "load" | "reset";
export type ManagerLifecycleSessionUpdateSource =
  | ManagerLifecycleSessionStartSource
  | "submit"
  | "next"
  | "back"
  | "navigate"
  | "simulate";
export type ManagerLifecycleActiveSessionChangeSource =
  | ManagerLifecycleSessionStartSource
  | "push"
  | "pop"
  | "setActive";
export type ManagerLifecycleErrorSource =
  | ManagerLifecycleSessionStartSource
  | ManagerLifecycleSessionUpdateSource
  | "createSubInterview"
  | "init";

export interface ManagerSessionStartEvent {
  manager: SessionManager;
  session: Session;
  config: SessionConfig;
  source: ManagerLifecycleSessionStartSource;
}

export interface ManagerSessionUpdateEvent {
  manager: SessionManager;
  session: Session;
  previousSession?: Session | null;
  source: ManagerLifecycleSessionUpdateSource;
}

export interface ManagerCompleteEvent extends ManagerSessionUpdateEvent {}

export interface ManagerErrorEvent {
  manager: SessionManager;
  error: Error;
  state: "error";
  source: ManagerLifecycleErrorSource;
}

export interface ManagerActiveSessionChangeEvent {
  manager: SessionManager;
  activeSession: Session | null;
  previousActiveSession: Session | null;
  activeIndex: number;
  source: ManagerLifecycleActiveSessionChangeSource;
}

export interface ManagerLifecycleEventMap {
  sessionStart: ManagerSessionStartEvent;
  create: ManagerSessionStartEvent;
  load: ManagerSessionStartEvent;
  reset: ManagerSessionStartEvent;
  sessionUpdate: ManagerSessionUpdateEvent;
  complete: ManagerCompleteEvent;
  error: ManagerErrorEvent;
  activeSessionChange: ManagerActiveSessionChangeEvent;
}

export type ManagerLifecycleEventName = keyof ManagerLifecycleEventMap;
export type ManagerLifecycleListener<K extends ManagerLifecycleEventName> = (event: ManagerLifecycleEventMap[K]) => void;

type ManagerLifecycleListeners = {
  [K in ManagerLifecycleEventName]: Set<ManagerLifecycleListener<K>>;
};

export interface ManagerLifecycleOptions {
  onSessionStart?: ManagerLifecycleListener<"sessionStart">;
  onCreate?: ManagerLifecycleListener<"create">;
  onLoad?: ManagerLifecycleListener<"load">;
  onReset?: ManagerLifecycleListener<"reset">;
  onSessionUpdate?: ManagerLifecycleListener<"sessionUpdate">;
  onComplete?: ManagerLifecycleListener<"complete">;
  onError?: ManagerLifecycleListener<"error">;
  onActiveSessionChange?: ManagerLifecycleListener<"activeSessionChange">;
}

const createListenerRegistry = (): ManagerLifecycleListeners => ({
  sessionStart: new Set(),
  create: new Set(),
  load: new Set(),
  reset: new Set(),
  sessionUpdate: new Set(),
  complete: new Set(),
  error: new Set(),
  activeSessionChange: new Set(),
});

export class ManagerLifecycle {
  private listeners: ManagerLifecycleListeners;

  constructor(options?: ManagerLifecycleOptions) {
    this.listeners = createListenerRegistry();

    if (!options) {
      return;
    }

    if (options.onSessionStart) {
      this.subscribe("sessionStart", options.onSessionStart);
    }
    if (options.onCreate) {
      this.subscribe("create", options.onCreate);
    }
    if (options.onLoad) {
      this.subscribe("load", options.onLoad);
    }
    if (options.onReset) {
      this.subscribe("reset", options.onReset);
    }
    if (options.onSessionUpdate) {
      this.subscribe("sessionUpdate", options.onSessionUpdate);
    }
    if (options.onComplete) {
      this.subscribe("complete", options.onComplete);
    }
    if (options.onError) {
      this.subscribe("error", options.onError);
    }
    if (options.onActiveSessionChange) {
      this.subscribe("activeSessionChange", options.onActiveSessionChange);
    }
  }

  subscribe = <K extends ManagerLifecycleEventName>(eventName: K, listener: ManagerLifecycleListener<K>) => {
    const listeners = this.listeners[eventName] as Set<ManagerLifecycleListener<K>>;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  };

  on = this.subscribe;

  onSessionStart = (listener: ManagerLifecycleListener<"sessionStart">) => this.subscribe("sessionStart", listener);

  onCreate = (listener: ManagerLifecycleListener<"create">) => this.subscribe("create", listener);

  onLoad = (listener: ManagerLifecycleListener<"load">) => this.subscribe("load", listener);

  onReset = (listener: ManagerLifecycleListener<"reset">) => this.subscribe("reset", listener);

  onSessionUpdate = (listener: ManagerLifecycleListener<"sessionUpdate">) => this.subscribe("sessionUpdate", listener);

  onComplete = (listener: ManagerLifecycleListener<"complete">) => this.subscribe("complete", listener);

  onError = (listener: ManagerLifecycleListener<"error">) => this.subscribe("error", listener);

  onActiveSessionChange = (listener: ManagerLifecycleListener<"activeSessionChange">) =>
    this.subscribe("activeSessionChange", listener);

  emitSessionStart = (event: ManagerSessionStartEvent) => {
    this.emit("sessionStart", event);
    this.emit(event.source, event);
  };

  emitSessionUpdate = (event: ManagerSessionUpdateEvent) => {
    this.emit("sessionUpdate", event);

    if (event.previousSession?.status !== "complete" && event.session.status === "complete") {
      this.emit("complete", event);
    }
  };

  emitError = (event: ManagerErrorEvent) => {
    this.emit("error", event);
  };

  emitActiveSessionChange = (event: ManagerActiveSessionChangeEvent) => {
    this.emit("activeSessionChange", event);
  };

  private emit = <K extends ManagerLifecycleEventName>(eventName: K, event: ManagerLifecycleEventMap[K]) => {
    const listeners = this.listeners[eventName] as Set<ManagerLifecycleListener<K>>;

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`[${LogGroup}] Error in \"${eventName}\" listener`, error);
      }
    }
  };
}