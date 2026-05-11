import { Interview as BasicInterview } from "./Interview";
import { InterviewProvider } from "./InterviewContext";
import { InterviewDebugForm } from "./InterviewDebugPanel";
import * as Slots from "./slots";

export type {
  InterviewContextState,
  InterviewProviderProps,
} from "./InterviewContext";
export { useInterview } from "./InterviewContext";
export {
  useInterviewActiveSessionChange,
  useInterviewComplete,
  useInterviewCreate,
  useInterviewError,
  useInterviewLifecycleEvent,
  useInterviewLoad,
  useInterviewReset,
  useInterviewSessionStart,
  useInterviewSessionUpdate,
} from "./useInterviewLifecycle";

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
  Reset: Slots.InterviewReset,
  Save: Slots.InterviewSave,
  Progress: Slots.InterviewProgress,
  Processing: Slots.InterviewProcessing,
  Validations: Slots.InterviewValidations,
  Debug: InterviewDebugForm,
});
