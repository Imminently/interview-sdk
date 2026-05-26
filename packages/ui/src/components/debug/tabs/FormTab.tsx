import { useInterview } from "@/interview/InterviewContext";
import { useFormContext } from "react-hook-form";
import { useMemo } from "react";
import { getAttributeText } from "@imminently/interview-sdk";

export const FormTab = () => {
  const { manager } = useInterview();
  const { watch } = useFormContext();
  const values = watch();

  const graph = useMemo(() => manager.parsedGraph, [manager]);

  const data = Object.keys(values).reduce((acc, curr) => {
    const label = graph ? getAttributeText(curr, graph) : curr;
    acc[label] = values[curr];
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-gray-500">Form values</h3>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
};
