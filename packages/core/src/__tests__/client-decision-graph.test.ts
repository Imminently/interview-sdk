import { describe, expect, it } from "bun:test";
import { releaseGraphToDecisionGraph, storedDecisionGraphBytes, toResponseDecisionGraph, toStoredDecisionGraph } from "@imminently/decisively-core";
import pako from "pako";
import { buildRemoteInterviewSubmitRequest } from "../backend/remote-backend";
import { CLIENT_GRAPH_FORMAT, clientReleaseGraph, clientRuleGraph } from "../graphUtil";

const ruleGraph = {
  options: { directed: true, multigraph: false, compound: false },
  nodes: [
    { v: "goal", value: { id: "goal", description: "the goal", type: "boolean" } },
    { v: "amount", value: { id: "amount", description: "the amount", type: "number" } },
  ],
  edges: [{ v: "goal", w: "amount" }],
};
// as decisionapi sends them: clientGraph (deflated JSON, a JSON array of bytes) and clientDecisionGraph
const clientGraph = Array.from(pako.deflate(JSON.stringify(ruleGraph))) as any;
const clientDecisionGraph = toResponseDecisionGraph(toStoredDecisionGraph(releaseGraphToDecisionGraph(ruleGraph))) as any;

describe("client graph forms", () => {
  it("reads the same rule graph from clientGraph and clientDecisionGraph", () => {
    expect(clientRuleGraph({ clientGraph })).toEqual(ruleGraph);
    expect(clientRuleGraph({ clientDecisionGraph })).toEqual(ruleGraph);
    expect(clientRuleGraph({})).toBeUndefined();
  });

  it("gives the engine the decision graph's bytes when there are some, otherwise the JSON", () => {
    const fromDecisionGraph = clientReleaseGraph({ clientDecisionGraph }) as { ruleGraphDecisionGraph: Uint8Array };
    expect(fromDecisionGraph.ruleGraphDecisionGraph).toEqual(storedDecisionGraphBytes(clientDecisionGraph));
    expect(clientReleaseGraph({ clientGraph })).toEqual({ rule_graph: ruleGraph });
  });

  it("asks decisionapi for the decision graph form on submit", () => {
    const request = buildRemoteInterviewSubmitRequest({
      session: { model: "m", release: "r", sessionId: "s", interactionId: "i" } as any,
      data: {},
      clientGraphFormat: CLIENT_GRAPH_FORMAT,
    });
    expect(request.body.clientGraphFormat).toBe("decisionGraph");
  });
});
