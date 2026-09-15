import { useInterview } from "@/interview/InterviewContext";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { decodeFieldSegment, getAttributeText, type Graph } from "@imminently/interview-sdk";

// A single "/" or "."-separated path segment (entity or attribute id), percent-encoded (see
// encodeFieldSegment) - decode first since the graph's node ids (GUID or canonical text) are
// raw/un-encoded. The graph can have a node for a canonical-text attribute too (keyed by the
// text itself), so always try the lookup; getAttributeText falls back to the id when not found.
const resolveSegment = (segment: string, graph: Graph | null | undefined): string => {
  const decoded = decodeFieldSegment(segment);
  return graph ? getAttributeText(decoded, graph) : decoded;
};

// Resolve every segment of a field name for display: flat-form keys are a whole "/"-joined path
// in one string (e.g. "household/h1/the%20age"); a segment reached by recursing into nested-form
// values (below) is already isolated, so splitting here is a no-op and it resolves directly.
const resolveFieldName = (name: string, graph: Graph | null | undefined): string =>
  name
    .split("/")
    .map((chunk) => chunk.split(".").map((segment) => resolveSegment(segment, graph)).join("."))
    .join("/");

// RHF nests dot-path field names (used inside repeating entities / useFieldArray) into real
// objects and arrays, so entity instance data shows up as arrays of objects rather than flat
// dotted keys - recurse into both to resolve every key, at every depth.
const buildDebugFormData = (value: unknown, graph: Graph | null | undefined): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => buildDebugFormData(item, graph));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      out[resolveFieldName(key, graph)] = buildDebugFormData(val, graph);
    }
    return out;
  }
  return value;
};

export const FormTab = () => {
  const { manager } = useInterview();
  const { watch } = useFormContext();
  const values = watch();

  const graph = useMemo(() => manager.parsedGraph, [manager]);
  const data = useMemo(() => buildDebugFormData(values, graph), [values, graph]);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-gray-500">Form values</h3>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
};
