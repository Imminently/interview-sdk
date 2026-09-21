import { describe, expect, it } from "bun:test";
import { SessionManager } from "../manager";
import type { Session } from "../types";

// `session.explanations` is keyed by the base attribute node id, which is the last
// segment of the "/"-delimited attribute path (matching the backend's own
// `extractAttributeId = path => path.split("/").pop()`).

const managerWith = (explanations: Record<string, string>): SessionManager => {
  const manager = new SessionManager({
    apiManager: { host: "https://example.com" },
    fileManager: { host: "https://example.com" },
  });
  const session = {
    sessionId: "s1",
    screen: { id: "step-1", title: "S", controls: [], attributes: [], allAttributes: [] },
    steps: [],
    data: { "@parent": undefined },
    explanations,
  } as unknown as Session;
  (manager as any).sessions = [session];
  (manager as any).active = 0;
  return manager;
};

describe("SessionManager.getExplanation", () => {
  const manager = managerWith({
    "the person's age": "Because they entered a date of birth.",
    "9f2c8a1e-guid": "GUID-keyed explanation.",
    "Ph.D. status": "Derived from enrolment records.",
  });

  it("looks up by the last '/'-segment of an entity path", () => {
    expect(manager.getExplanation("household/id-1/the person's age")).toBe(
      "Because they entered a date of birth.",
    );
  });

  it("handles a bare GUID attribute (no separators)", () => {
    expect(manager.getExplanation("9f2c8a1e-guid")).toBe("GUID-keyed explanation.");
  });

  it("does not split on '.', so a canonical name containing a dot still resolves", () => {
    // The previous `split(".")` returned " status" here and missed the entry.
    expect(manager.getExplanation("employees/1/Ph.D. status")).toBe("Derived from enrolment records.");
  });

  it("returns undefined for an unknown attribute", () => {
    expect(manager.getExplanation("household/id-1/unknown")).toBeUndefined();
  });
});
