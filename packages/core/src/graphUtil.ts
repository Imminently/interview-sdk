import graphlib from "@dagrejs/graphlib";
import {
  DecisionGraph,
  decisionGraphRelease,
  decisionGraphToLegacyGraph,
  isStoredDecisionGraph,
  storedDecisionGraphBytes,
} from "@imminently/decisively-core";
import pako from "pako";

export type Graph = graphlib.Graph & { _nodes: Record<string, any> };

// graphlib's own node() typing is `any` - this is the shape every node in our graphs actually has.
export interface AttributeGraphNode {
  description?: string;
  entity?: string;
}

export interface AttributeDescription {
  description: string;
  entity?: string;
  /**
   * False when a graph was loaded but had no node for this attribute. The client graph is
   * pruned server-side to the active goal's dependency closure, so this usually means the
   * attribute isn't wired into that goal (or the reference itself is wrong) rather than a
   * client-side lookup bug. Undefined when there was no graph at all to check against.
   */
  foundInGraph?: boolean;
}

export const graphFromJSON = (json: string | object): Graph => {
  const graph = graphlib.json.read(typeof json === "string" ? JSON.parse(json) : json);
  return graph as Graph;
};

/**
 * The client graph format the SDK asks decisionapi for (`clientGraphFormat`): a decision graph, sent as
 * `clientDecisionGraph`. decisionapi sends it only to clients that ask; older SDKs, which don't, get `clientGraph`
 * (deflated JSON) as before. decisionapi must know the option before an SDK that sends it is used (it rejects
 * request fields it doesn't know).
 */
export const CLIENT_GRAPH_FORMAT = "decisionGraph";

/** A client graph as decisionapi sends it in the decision graph format (`{ decisionGraph, encoding }`). */
export type ClientDecisionGraph = { decisionGraph: string | Uint8Array; encoding?: "deflate" };

/**
 * A session's client graph as its rule graph JSON (graphlib JSON, what `clientGraph` decompresses to), from either
 * form: `clientDecisionGraph` (read back exactly) or `clientGraph` (deflated JSON).
 */
export const clientRuleGraph = (session: { clientGraph?: unknown; clientDecisionGraph?: unknown }) => {
  if (isStoredDecisionGraph(session.clientDecisionGraph)) {
    return DecisionGraph.from(session.clientDecisionGraph).toRuleGraph();
  }
  return session.clientGraph ? decompressGraph(session.clientGraph) : undefined;
};

/**
 * What the rules engine takes as a release's rule graph, from a session's client graph: its decision graph's bytes
 * (`ruleGraphDecisionGraph`, read faster than the JSON) when the session has one, otherwise the rule graph JSON.
 */
export const clientReleaseGraph = (
  session: { clientGraph?: unknown; clientDecisionGraph?: unknown },
  ruleGraph?: unknown,
): { ruleGraphDecisionGraph: Uint8Array } | { rule_graph: unknown } => {
  if (isStoredDecisionGraph(session.clientDecisionGraph)) {
    return { ruleGraphDecisionGraph: storedDecisionGraphBytes(session.clientDecisionGraph) };
  }
  return { rule_graph: ruleGraph ?? clientRuleGraph(session) };
};

export const decompressGraph = (compressed: any) => {
  const decompressed = pako.inflate(compressed, { to: "string" });
  return JSON.parse(decompressed);
};

/**
 * The engine's legacy debug graph (`{ type: "graph", debug: true }`, deprecated) for a solve that asked for a decision
 * graph instead (`{ type: "decisionGraph", debug: true }`): the same graph, with rule data from the solve's release
 * (its rule graph JSON).
 */
export const legacyDebugGraph = (decisionGraph: Uint8Array, release: { rule_graph?: unknown }) =>
  decisionGraphToLegacyGraph(decisionGraph, { type: "graph", debug: true }, decisionGraphRelease(release as any));

/**
 * Get the attribute text from the graph, falling back to the id if not found
 * @param id Attribute id
 * @param graph A parsed graph instance
 */
export const getAttributeText = (id: string, graph: Graph): string => {
  const node: AttributeGraphNode | undefined = graph.node(id);
  if (!node) return id;
  return node.description ?? id;
};

const valueIsBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return true;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    return lower === "true" || lower === "false";
  }
  return false;
};

const booleanFromValue = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return false;
}

export const displayValue = (value: any) => {
  if (value === null || value === "null")
    return "UNCERTAIN";
  if (value === undefined)
    return "UNKNOWN";
  if (valueIsBoolean(value))
    return booleanFromValue(value) ? "TRUE" : "FALSE";
  if (typeof value === "string" && value.trim() === "")
    return "EMPTY STRING";
  return String(value);
};