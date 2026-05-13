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
type InterviewCompoundComponent = typeof BasicInterview & {
  /** Provides interview state and form context for custom layouts. */
  Root: typeof InterviewProvider;
  /** Renders when the manager enters the error state. */
  Error: typeof Slots.InterviewError;
  /** Renders while the interview is performing its initial create or load. */
  Loading: typeof Slots.InterviewLoading;
  /** Renders the default visited-step sidebar with progress. */
  Steps: typeof Slots.InterviewSteps;
  /** Renders the default successful interview layout. */
  Content: typeof Slots.InterviewContent;
  /** Renders the current screen controls inside the shared interview form context. */
  Form: typeof Slots.InterviewForm;
  /** Renders the primary submit action for the active interview form. */
  Next: typeof Slots.InterviewNext;
  /** Renders a back button wired to `manager.back()`. */
  Back: typeof Slots.InterviewBack;
  /** Renders a button that restarts the current interview. */
  Reset: typeof Slots.InterviewReset;
  /** Renders an experimental save action for the current interview values. */
  Save: typeof Slots.InterviewSave;
  /** Renders percentage-complete progress for the active session. */
  Progress: typeof Slots.InterviewProgress;
  /** Renders an indeterminate progress indicator during async operations. */
  Processing: typeof Slots.InterviewProcessing;
  /** Renders the current screen or step title. */
  Title: typeof Slots.InterviewTitle;
  /** Renders current validation messages for the active screen. */
  Validations: typeof Slots.InterviewValidations;
  /** Renders the debug form viewer inside an existing interview form context. */
  Debug: typeof InterviewDebugForm;
};

export const Interview: InterviewCompoundComponent = Object.assign(BasicInterview, {
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
  Title: Slots.InterviewTitle,
  Validations: Slots.InterviewValidations,
  Debug: InterviewDebugForm,
});
