import { Interview as BasicInterview } from "./Interview";
import { InterviewProvider } from "./InterviewContext";
import { InterviewDebugPanel } from "./InterviewDebugPanel";
import * as Slots from "./slots";

export type {
  InterviewContextState,
  InterviewProviderProps,
} from "./InterviewContext";
export { useInterview } from "./InterviewContext";

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
  Validations: Slots.InterviewValidations,
  Debug: InterviewDebugPanel,
});
