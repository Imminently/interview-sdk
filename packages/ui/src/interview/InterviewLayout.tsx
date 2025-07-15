import * as Slots from "./slots";
import { SidebarInset, SidebarProvider } from "../components/ui/sidebar";
import InterviewDebugPanel from "./InterviewDebugPanel";
import { useInterview } from "./InterviewContext";
import { useOptions } from "@/providers";

// TEMP disable the idea of slots using slotName as it did not provide the control we wanted.
// It was also kind of awkward to use.

/*

Map of slot name to default slot element
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

*/

/**
 * Default render layout for an interview.
 */
export const InterviewLayout = () => {
  const { debug } = useOptions();
  const { state, session } = useInterview();

  if (state !== "success" && !session) {
    // we are in one of these states
    return (
      <>
        <Slots.InterviewError />
        <Slots.InterviewLoading />
      </>
    )
  }

  return (
    <SidebarProvider>
      <Slots.InterviewSteps />
      <SidebarInset>
        <Slots.InterviewContent />
      </SidebarInset>
      {debug ? <InterviewDebugPanel /> : null}
    </SidebarProvider>
  );
};