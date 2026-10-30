import { describe, expect, it } from "bun:test";
import { EDGE_FROM_RELEASE, EDGE_FROM_STATE, writeDecisionGraph } from "@imminently/decisively-core";
import { legacyDebugGraph } from "../graphUtil";

// a client solve's debug decision graph: goal (derived) <- amount (input), with debug reasons
const decisionGraph = writeDecisionGraph({
  session: false,
  debug: true,
  templates: ["goal", "amount"],
  templateEntity: Uint8Array.from([0, 0]),
  instances: [],
  nodes: [
    { template: 0, instance: -1 },
    { template: 1, instance: -1 },
  ],
  nodeCount: 2,
  values: [{ derived: true }, { input: 5 }],
  edges: [[0, 1, EDGE_FROM_RELEASE | EDGE_FROM_STATE]],
});
const release = {
  rule_graph: {
    nodes: [
      { v: "goal", value: { id: "goal", description: "the goal", type: "boolean" } },
      { v: "amount", value: { id: "amount", description: "the amount", type: "number" } },
    ],
    edges: [{ v: "goal", w: "amount" }],
  },
};

describe("legacyDebugGraph", () => {
  it("gives the legacy debug graph for a decision graph: values with the client graph's rule data, and edges", () => {
    const graph = legacyDebugGraph(decisionGraph, release) as any;
    const nodes = Object.fromEntries(graph.nodes.map((node: any) => [node.v, node.value]));
    expect(nodes.goal).toMatchObject({ description: "the goal", type: "boolean", derived: true });
    expect(nodes.amount).toMatchObject({ description: "the amount", type: "number", input: 5 });
    expect(graph.edges).toEqual([{ v: "goal", w: "amount" }]);
  });
});
