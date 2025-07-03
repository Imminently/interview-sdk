import React, { PropsWithChildren } from "react";
import { ManagerOptions } from "@imminently/interview-sdk";
import * as Slots from "./slots";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import InterviewDebugPanel from "./InterviewDebugPanel";

/**
 * Default render layout for an interview.
 */
export const InterviewLayout = ({ options, children }: PropsWithChildren<{ options: ManagerOptions }>) => {
  // Map of slot name to default slot element
  const slotDefaults: Record<string, React.ReactElement> = {
    error: <Slots.InterviewError key="interview-error" />,
    loading: <Slots.InterviewLoading key="interview-loading" />,
    steps: <Slots.InterviewSteps key="interview-steps" />,
    content: <Slots.InterviewContent key="interview-content" />,
  };

  // Track which slots have been filled
  const slotFilled: Record<string, boolean> = {};

  // Build the output array in the same order as children
  const ordered: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      ordered.push(child);
      return;
    }
    // @ts-ignore
    const slot = child.type.slotName as string | undefined;
    if (slot && slotDefaults[slot]) {
      ordered.push(React.cloneElement(child, { key: `interview-slot-${slot}` }));
      slotFilled[slot] = true;
    } else {
      ordered.push(child);
    }
  });

  // Append any default slots that were not filled
  Object.entries(slotDefaults).forEach(([slot, element]) => {
    if (!slotFilled[slot]) {
      ordered.push(element);
    }
  });

  return (
    <SidebarProvider>
      <Slots.InterviewError />
      <Slots.InterviewLoading />
      <Slots.InterviewSteps />
      <SidebarInset>
        <Slots.InterviewContent />
      </SidebarInset>
      {options.debug ? <InterviewDebugPanel /> : null}
    </SidebarProvider>
  );
};