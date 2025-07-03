import React from "react"
import { useFormContext } from "react-hook-form"
import { Badge } from "../components/ui/badge"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"

const stringValue = (value: any) => {
  // support null -> null, undefined -> undefined, boolean -> true/false, number -> string
  if (typeof value === "string") {
    return value;
  } else if (typeof value === "object") {
    return JSON.stringify(value);
  } else if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return String(value);
  }
}

export default function InterviewDebugPanel() {
  const { watch } = useFormContext();
  const values = watch();
  return (
    <Sidebar collapsible="offcanvas" className="sticky top-0 hidden h-svh border-l lg:flex">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="p-0 text-lg font-bold">Form values</SidebarGroupLabel>
          <SidebarMenu>
            {Object.entries(values).map(([key, value]) => (
              <SidebarMenuItem key={key} className="flex items-center justify-between py-1">
                <span className="text-sm font-mono text-muted-foreground">{key}</span>
                <Badge className="rounded-full text-sm font-mono">{stringValue(value)}</Badge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
