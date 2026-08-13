import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MockInterviewBackend } from "../backend/mock-backend";
import { buildRemoteInterviewSubmitRequest } from "../backend/remote-backend";
import { SessionManager } from "../manager";
import type { Session } from "../types";

const createSession = (): Session => ({
  sessionId: "session-1",
  interactionId: "interaction-1",
  interviewId: "interview-1",
  goal: "goal-1",
  model: "model-1",
  release: "release-1",
  reportId: "report-1",
  status: "in-progress",
  context: { entity: "global" },
  data: { "@parent": undefined } as Session["data"],
  steps: [
    {
      id: "step-1",
      title: "Step 1",
      context: { entity: "global" },
      current: true,
      complete: false,
      visited: false,
      skipped: false,
      visitable: true,
    },
  ],
  screen: {
    title: "Screen 1",
    id: "step-1",
    context: { entity: "global" },
    controls: [],
    attributes: [],
    allAttributes: [],
  },
});

describe("response override forwarding", () => {
  beforeEach(() => {
    MockInterviewBackend.reset();
    Object.defineProperty(globalThis, "sessionStorage", {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      configurable: true,
    });
  });

  it("forwards response through RemoteInterviewBackend submit overrides", async () => {
    const request = buildRemoteInterviewSubmitRequest({
      session: createSession(),
      data: { field: "value" },
      overrides: { response: ["data", "screen"] },
    });

    expect(request).toEqual({
      url: "model-1/release-1",
      body: expect.objectContaining({
        data: { field: "value" },
        response: ["data", "screen"],
      }),
      config: {
        params: {
          session: "session-1",
          interaction: "interaction-1",
        },
      },
    });
  });

  it("falls back to the stored session response on submit overrides", async () => {
    const submit = jest.fn(async () => createSession());
    MockInterviewBackend.configure({
      submit,
    });
    const manager = new SessionManager({
      backend: { host: "https://example.com" },
      fileManager: { host: "https://example.com" },
    });
    const session = createSession();

    (manager as any).sessions = [session];
    (manager as any).active = 0;
    (manager as any).sessionConfigs[session.sessionId] = {
      response: ["data", "screen"],
    };

    await manager.submit({ field: "value" });

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        overrides: {
          response: ["data", "screen"],
        },
      }),
    );
  });
});
