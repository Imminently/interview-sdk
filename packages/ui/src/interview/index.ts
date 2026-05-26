import { DebugPanel as InterviewDebugFloatingPanel } from "@/components/debug";
import { Interview as BasicInterview } from "./Interview";
import { InterviewProvider } from "./InterviewContext";
import {
  InterviewBack,
  InterviewContent,
  InterviewError,
  InterviewForm,
  InterviewLoading,
  InterviewNext,
  InterviewProcessing,
  InterviewProgress,
  InterviewReset,
  InterviewSave,
  InterviewSteps,
  InterviewTitle,
  InterviewValidations,
} from "./slots";

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
  /**
   * InterviewProvider is a React context provider that manages the state and behavior of an interview session.
   * It provides methods to navigate through the interview steps, manage form values, and handle interactions.
   */
  Root: typeof InterviewProvider;
  /**
   * Renders when the interview manager enters the `error` state.
   *
   * By default this shows a simple translated error shell and the current error message.
   * Use `asChild` to supply your own container while keeping the same conditional rendering.
   */
  Error: typeof InterviewError;
  /**
   * Renders while the interview is performing its initial create or load operation.
   *
   * This only appears before a base session is available. Once a session exists, prefer
   * {@link InterviewProcessing} for in-flow async feedback.
   */
  Loading: typeof InterviewLoading;
  /**
   * Renders the visited and current interview steps in the default sidebar layout.
   *
   * This is useful for desktop layouts that need a persistent step list and an embedded
   * {@link InterviewProgress} summary.
   */
  Steps: typeof InterviewSteps;
  /**
   * Renders the default interview layout for a successful session.
   *
   * The built-in layout includes {@link InterviewTitle}, {@link InterviewForm},
   * {@link InterviewValidations}, {@link InterviewBack}, and {@link InterviewNext}.
   * Provide children to replace that layout while keeping the surrounding interview context.
   */
  Content: typeof InterviewContent;
  /**
   * Renders the controls for the current screen within the shared interview form context.
   *
   * `Interview.Form` owns the control rendering for the active screen, while submission is handled
   * by the surrounding provider form. `Interview.Next` is designed to work with this component by
   * rendering a submit button for the same form.
   */
  Form: typeof InterviewForm;
  /**
   * Renders the primary submit action for the active interview form.
   *
   * This component does not call `manager.next()` directly. Instead it renders a submit button
   * for the provider-owned form, so it should be used within {@link Interview}.
   *
   * @example
   * <Interview.Next asChild>
   *   <button className="btn btn-primary">Continue</button>
   * </Interview.Next>
   */
  Next: typeof InterviewNext;
  /**
   * Renders a back button wired to the active interview manager.
   *
   * Use this anywhere within {@link Interview} when you want the SDK to handle
   * disabling and navigation state for you.
   *
   * @example
   * <Interview.Back asChild>
   *   <button className="btn btn-secondary">Previous</button>
   * </Interview.Back>
   */
  Back: typeof InterviewBack;
  /**
   * Renders a button that restarts the current interview using the existing manager configuration.
   *
   * @example
   * <Interview.Reset asChild>
   *   <button className="btn btn-secondary">Start Over</button>
   * </Interview.Reset>
   */
  Reset: typeof InterviewReset;
  /**
   * Renders an experimental save action for the current interview values.
   *
   * The component validates the current form values and then calls `manager.save(values)` without
   * advancing the interview.
   *
   * @example
   * <Interview.Save asChild>
   *   <button className="btn btn-secondary">Save Draft</button>
   * </Interview.Save>
   */
  Save: typeof InterviewSave;
  /**
   * Renders a progress summary for the active session, including percentage complete and ETA when available.
   *
   * Use `asChild` to inject the progress props into your own wrapper when you need a custom shell.
   */
  Progress: typeof InterviewProgress;
  /**
   * Renders an indeterminate progress indicator while the interview is performing an async action.
   *
   * This is intended for in-flow operations after a session already exists, such as advancing,
   * resetting, or saving.
   */
  Processing: typeof InterviewProcessing;
  /**
   * Renders the current screen title, falling back to the active step title when needed.
   *
   * @example
   * <Interview.Title asChild>
   *   <h1 className="text-3xl font-serif" />
   * </Interview.Title>
   */
  Title: typeof InterviewTitle;
  /**
   * Renders visible validation messages for the current screen.
   *
   * Pass `severity` to limit the output to errors or warnings only.
   */
  Validations: typeof InterviewValidations;
  /**
   * A draggable, floating debug panel with tabs for session overview, form values,
   * steps, and controls. Add this anywhere inside {@link Interview} to enable debug tools.
   *
   * Debug mode must be toggled on (Cmd+D / Ctrl+D) before the panel appears.
   */
  Debug: typeof InterviewDebugFloatingPanel;
};

export const Interview: InterviewCompoundComponent = Object.assign(BasicInterview, {
  Root: InterviewProvider,
  Error: InterviewError,
  Loading: InterviewLoading,
  Steps: InterviewSteps,
  Content: InterviewContent,
  Form: InterviewForm,
  Next: InterviewNext,
  Back: InterviewBack,
  Reset: InterviewReset,
  Save: InterviewSave,
  Progress: InterviewProgress,
  Processing: InterviewProcessing,
  Title: InterviewTitle,
  Validations: InterviewValidations,
  Debug: InterviewDebugFloatingPanel,
});
