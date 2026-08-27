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
});
