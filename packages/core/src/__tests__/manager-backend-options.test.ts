import { describe, expect, it } from "@jest/globals";
import { LocalSessionBackend } from "../backend/local-backend";
import { RemoteSessionBackend } from "../backend/remote-backend";
import { SessionManager } from "../manager";
import type { RulesEngine, Session, SubmitOptions } from "../types";

const fileManager = { host: "https://files.example.com" };
const rulesEngine: RulesEngine = {
  solve: async () => ({}),
};
const session = {
  sessionId: "session-1",
  interactionId: "interaction-1",
  interviewId: "interview-1",
  goal: "goal-1",
  model: "model-1",
  release: "release-1",
  reportId: "",
  status: "in-progress",
  context: { entity: "global" },
  data: {},
  state: [],
  steps: [],
  screen: {
    id: "screen-1",
    title: "Screen 1",
    context: { entity: "global" },
    controls: [],
    attributes: [],
    allAttributes: [],
  },
} as Session;

describe("SessionManager backend options", () => {
  it("supports the deprecated apiManager options object", () => {
    const manager = new SessionManager({
      apiManager: { host: "https://api.example.com" },
      fileManager,
    });

    expect(manager.apiManager).toBeInstanceOf(RemoteSessionBackend);
  });

  it("supports the backend options object", () => {
    const manager = new SessionManager({
      backend: { host: "https://api.example.com" },
      fileManager,
    });

    expect(manager.apiManager).toBeInstanceOf(RemoteSessionBackend);
  });

  it("supports the deprecated apiManager backend instance", () => {
    const backend = new LocalSessionBackend({ rulesEngine });
    const manager = new SessionManager({
      apiManager: backend,
      fileManager,
    });

    expect(manager.apiManager).toBe(backend);
  });

  it("supports the backend instance", () => {
    const backend = new LocalSessionBackend({ rulesEngine });
    const manager = new SessionManager({
      backend,
      fileManager,
    });

    expect(manager.apiManager).toBe(backend);
  });

  it("prefers backend over deprecated apiManager when both are provided", () => {
    const backend = new LocalSessionBackend({ rulesEngine });
    const apiManager = new LocalSessionBackend({ rulesEngine });
    const manager = new SessionManager({
      backend,
      apiManager,
      fileManager,
    });

    expect(manager.apiManager).toBe(backend);
  });

  it("does not construct a remote backend from undefined apiManager when backend is provided", () => {
    const backend = new LocalSessionBackend({ rulesEngine });

    expect(
      () =>
        new SessionManager({
          backend,
          apiManager: undefined,
          fileManager,
        }),
    ).not.toThrow();
  });

  it("throws clearly when neither backend nor deprecated apiManager is provided", () => {
    expect(
      () =>
        new SessionManager({
          fileManager,
        } as never),
    ).toThrow("SessionManager requires a backend");
  });

  it("clones the manager around a session snapshot without creating a new backend", () => {
    const backend = new LocalSessionBackend({ rulesEngine });
    const manager = new SessionManager({
      backend,
      fileManager,
      sessionStore: {
        get: () => ({ sessions: [session], active: 0 }),
        set: () => undefined,
      },
    });

    const clone = manager.clone();

    expect(clone).toBeInstanceOf(SessionManager);
    expect(clone).not.toBe(manager);
    expect(clone.apiManager).toBe(backend);
    expect(clone.activeSession).toEqual(session);
    expect(clone.activeSession).not.toBe(session);
  });

  it("saves generated entity screens using current_step instead of screen id", async () => {
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: () => null,
      },
      configurable: true,
    });
    const backend = new LocalSessionBackend({ rulesEngine });
    let submitOptions: SubmitOptions | undefined;
    backend.submit = async (options) => {
      submitOptions = options;
      return options.session;
    };
    const generatedSession = {
      ...session,
      data: {
        "@parent": "event_days/2026-07-11",
      },
      current_step: "event_days/2026-07-11/day-info",
      screen: {
        ...session.screen,
        id: "event_days/2026-07-11/day-info/2026-07-11",
      },
    } as Session & { current_step: string };
    const manager = new SessionManager({
      backend,
      fileManager,
      sessionStore: {
        get: () => ({ sessions: [generatedSession], active: 0 }),
        set: () => undefined,
      },
    });

    await manager.save({ answer: "yes" } as never);

    expect(submitOptions?.navigate).toBe("event_days/2026-07-11/day-info");
  });
});
