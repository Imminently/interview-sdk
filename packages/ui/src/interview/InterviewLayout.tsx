import React, { PropsWithChildren } from "react";
import * as Slots from "./slots";
import { SidebarProvider } from "../components/ui/sidebar";

/**
 * Default render layout for an interview.
 */
export const InterviewLayout = ({ children }: PropsWithChildren) => {
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
      {ordered}
    </SidebarProvider>
  );
};