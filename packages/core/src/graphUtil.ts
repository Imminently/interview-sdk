import graphlib from "@dagrejs/graphlib";
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

export const decompressGraph = (compressed: any) => {
  const decompressed = pako.inflate(compressed, { to: "string" });
  return JSON.parse(decompressed);
};

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