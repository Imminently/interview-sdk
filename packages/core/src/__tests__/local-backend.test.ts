import { describe, expect, it } from "@jest/globals";
import { LocalSessionBackend } from "../backend/local-backend";
import type { RulesEngine } from "../types";

const releaseData = {
  id: "release-1",
  model: "model-1",
  interviews: [],
};

const rulesEngine: RulesEngine = {
  solve: async () => ({}),
};

describe("LocalSessionBackend", () => {
  it("requires a host, rulesEngine, or rulesEngineScript", () => {
    expect(() => new LocalSessionBackend({ releaseData } as never)).toThrow(
      "LocalSessionBackend requires host, rulesEngine, or rulesEngineScript",
    );
  });

  it("can be constructed with a host", () => {
    expect(() => new LocalSessionBackend({ host: "http://localhost:3000", releaseData })).not.toThrow();
  });

  it("can be constructed with a rules engine", () => {
    expect(() => new LocalSessionBackend({ releaseData, rulesEngine })).not.toThrow();
  });

  it("can be constructed with a rules engine script", () => {
    expect(
      () => new LocalSessionBackend({ releaseData, rulesEngineScript: "({ solve: async () => ({}) })" }),
    ).not.toThrow();
  });

  it("loads a rules engine script function once", async () => {
    let loadCount = 0;
    const backend = new LocalSessionBackend({
      releaseData,
      rulesEngineScript: () => {
        loadCount += 1;
        return "({ solve: async () => ({}) })";
      },
    });

    await backend.getRulesEngine();
    await backend.getRulesEngineRuntime();
    await backend.getRulesEngine();

    expect(loadCount).toBe(1);
  });
});
