import { InterviewProvider } from "./InterviewContext";
import { Interview as BasicInterview } from "./Interview";
import * as Slots from "./slots";

export { useInterview } from "./InterviewContext";
export type { InterviewProviderProps, InterviewContextState } from "./InterviewContext";

export * from "./slots";
export const Interview = Object.assign(BasicInterview, {
  Root: InterviewProvider,
  Error: Slots.InterviewError,
  Loading: Slots.InterviewLoading,
  Steps: Slots.InterviewSteps,
  Content: Slots.InterviewContent,
  Form: Slots.InterviewForm,
  Next: Slots.InterviewNext,
  Back: Slots.InterviewBack,
  Progress: Slots.InterviewProgress,
  Processing: Slots.InterviewProcessing,
});