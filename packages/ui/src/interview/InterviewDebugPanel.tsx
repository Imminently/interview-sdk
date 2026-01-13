import {
  Sidebar,
  SidebarContent,
  SidebarGroup
} from "@/components/ui/sidebar";
import { useTheme } from "@/providers";
import { useFormContext } from "react-hook-form";
import { useInterview } from "./InterviewContext";
import { useMemo } from "react";
import { getAttributeText } from "@imminently/interview-sdk";


export const InterviewDebugForm = () => {
  const { t } = useTheme();
  const context = useInterview();
  const { watch } = useFormContext();
  const values = watch();

  const graph = useMemo(() => {
    const { manager } = context;
    console.log("manager.parsedGraph", manager.clientGraph, manager.parsedGraph);
    return manager.parsedGraph;
  }, [context])

  // map values to use node labels
  const data = Object.keys(values).reduce((acc, curr, index) => {
    const label = graph ? getAttributeText(curr, graph) : curr;
    acc[label] = values[curr];
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-bold">{t("debug.form_values")}</h2>
      <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
    </div>
  );
}

export const InterviewDebugPanel = () => {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="sticky top-0 hidden h-svh border-l lg:flex w-[500px]"
    >
      <SidebarContent>
        <SidebarGroup>
          <InterviewDebugForm />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
