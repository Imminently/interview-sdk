import { describe, expect, it } from "@jest/globals";
import { transformResponse } from "../util";
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
  data: { "@parent": "employees/employee-1" } as Session["data"],
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
    controls: [
      {
        type: "number_of_instances",
        attribute: "householdCount",
        entity: "householdMembers",
        id: "control-1",
        label: "Household members",
      } as any,
    ],
    attributes: [],
    allAttributes: [],
  },
});

describe("transformResponse", () => {
  it("normalizes input and expands number_of_instances without mutating a frozen tree", () => {
    const session = createSession();

    expect(() =>
      transformResponse(session, {
        householdMembers: "2",
        boolValue: "true",
        emptyValue: "",
      }),
    ).not.toThrow();

    const result = transformResponse(session, {
      householdMembers: "2",
      boolValue: "true",
      emptyValue: "",
    });

    expect(result["@parent"]).toBe("employees/employee-1");
    expect(result.boolValue).toBe(true);
    expect(result.emptyValue).toBeNull();
    expect(Array.isArray(result.householdMembers)).toBe(true);
    expect(result.householdMembers).toHaveLength(2);
    expect(result.householdMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@id": expect.any(String) }),
        expect.objectContaining({ "@id": expect.any(String) }),
      ]),
    );
  });
});