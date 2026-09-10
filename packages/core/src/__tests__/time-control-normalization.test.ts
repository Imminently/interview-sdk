import { describe, expect, test } from "bun:test";
import { ApiManager } from "../api-manager";
import { normalizeSessionControls } from "../util";
import type { Session } from "../types";

const createSession = (minutesIncrement: unknown): Session => ({
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
  steps: [],
  screen: {
    title: "Times",
    id: "screen-1",
    context: { entity: "global" },
    controls: [{
      id: "start-time",
      type: "time",
      attribute: "start",
      minutes_increment: minutesIncrement,
    } as any],
    attributes: ["start"],
    allAttributes: ["start"],
  },
});

describe("time-control response normalization", () => {
  test("normalizes string increments without mutating the response", () => {
    const response = createSession("15");
    const normalized = normalizeSessionControls(response);

    expect((response.screen.controls[0] as any).minutes_increment).toBe("15");
    expect((normalized.screen.controls[0] as any).minutes_increment).toBe(15);
  });

  test("normalizes API session responses before returning them", async () => {
    const apiManager = new ApiManager({ host: "https://example.com" });
    (apiManager as any).api = {
      post: async () => ({ data: createSession("30") }),
    };

    const session = await apiManager.create({ project: "model-1", release: "release-1" } as any);

    expect((session.screen.controls[0] as any).minutes_increment).toBe(30);
  });

  test("returns a plain mutable session, not a frozen one", () => {
    const normalized = normalizeSessionControls(createSession("15"));

    // SessionManager writes straight onto the session it gets back from the API
    // layer: the client-graph cache (`session.decompressedClientGraph = ...`),
    // client-side dynamic results (`activeSession.screen = ...`, `.validations`,
    // `.state`), and bookmark restore (`session.clientGraph = ...`). An immer
    // `produce` result is deep-frozen, so every one of those assignments throws
    // "Cannot add property ..., object is not extensible". Guard against
    // reintroducing that: the result and its nested objects must be writable.
    expect(Object.isFrozen(normalized)).toBe(false);
    expect(Object.isFrozen(normalized.screen)).toBe(false);
    expect(Object.isFrozen(normalized.screen.controls[0])).toBe(false);

    expect(() => {
      (normalized as any).decompressedClientGraph = { nodes: [] };
      normalized.screen.title = "client-dynamic screen";
      (normalized.screen.controls[0] as any).minutes_increment = 30;
    }).not.toThrow();

    expect((normalized as any).decompressedClientGraph).toEqual({ nodes: [] });
    expect(normalized.screen.title).toBe("client-dynamic screen");
  });
});
