import { describe, expect, it } from "@jest/globals";
import { INTERVIEW_BACKEND_BRAND, type InterviewBackend } from "../backend/backend";
import { MockInterviewBackend } from "../backend/mock-backend";
import { SessionManager } from "../manager";
import type { Session, SubmitOptions } from "../types";

const fileManager = { host: "https://files.example.com" };
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
  data: { "@parent": "global" },
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
} as unknown as Session;

describe("SessionManager backend options", () => {
  it("supports the backend options object", () => {
    const manager = new SessionManager({
      backend: { host: "https://api.example.com" },
      fileManager,
    });

    expect(manager.interviewBackend).toBeInstanceOf(MockInterviewBackend);
  });

  it("supports the backend instance", () => {
    const backend = new MockInterviewBackend({ session });
    const manager = new SessionManager({
      backend,
      fileManager,
    });

    expect(manager.interviewBackend).toBe(backend);
  });

  it("throws clearly when backend is not provided", () => {
    expect(
      () =>
        new SessionManager({
          fileManager,
        } as never),
    ).toThrow("SessionManager requires a backend");
  });

  it("clones the manager around a session snapshot without creating a new backend", () => {
    const backend = new MockInterviewBackend({ session });
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
    expect(clone.interviewBackend).toBe(backend);
    expect(clone.activeSession).toEqual(session);
    expect(clone.activeSession).not.toBe(session);
  });

  it("clones the manager with an overridden backend without mutating the backend", () => {
    const originalBackend = new MockInterviewBackend({ session });
    const overrideBackend = {
      [INTERVIEW_BACKEND_BRAND]: true as const,
      create: async () => session,
      load: async () => session,
      submit: async (options) => options.session,
      chat: async () => ({}) as never,
      navigate: async (options) => options.session,
      back: async (options) => options.session,
      simulate: async (options) => options.session,
      exportTimeline: async () => ({ interview: "", goal: "", questions: [] }),
      getRulesEngine: async () => "",
      getConnectedData: async <T = unknown>() => ({} as T),
    } satisfies InterviewBackend;
    const manager = new SessionManager({
      backend: originalBackend,
      fileManager,
      sessionStore: {
        get: () => ({ sessions: [session], active: 0 }),
        set: () => undefined,
      },
    });

    const clone = manager.clone({ backend: overrideBackend });

    expect(clone.interviewBackend).toBe(overrideBackend);
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
    let submitOptions: SubmitOptions | undefined;
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
    const backend = new MockInterviewBackend({
      session: generatedSession,
      submit: (options) => {
        submitOptions = options;
        return options.session;
      },
    });
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
