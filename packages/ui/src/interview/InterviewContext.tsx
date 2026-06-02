import { AttributeNestingProvider, OptionsProvider } from "@/providers";
import type { Control, ManagerState, Session, SessionManager } from "@imminently/interview-sdk";
import { type PropsWithChildren, createContext, useContext, useId, useMemo, useSyncExternalStore } from "react";
import { FormProvider, type UseFormProps, useForm } from "react-hook-form";
import { type IconMap, type InterviewControls, type Theme, ThemeProvider } from "../providers/ThemeProvider";
import { cn } from "@/util";

export type InterviewContextState = {
  formId: string;
  manager: SessionManager;
  session: Session;
  callbacks: InterviewCallbacks;
  state: ManagerState;
  error?: Error;
  validation: {
    error: boolean;
    warning: boolean;
  };
  isLoading: boolean;
  backDisabled: boolean;
  nextDisabled: boolean;
};

export interface InterviewCallbacks {
  onDebugControlClick?: (control: Control, interview: InterviewContextState) => void;
}

/** Base user configurable controls for the interview. */
export type InterviewConfig = {
  /** Exposed limited set of props from `react-hook-form` */
  form?: ExposedFormControls;
  theme?: Theme;
  icons?: IconMap;
  slots?: Partial<InterviewControls>;
  callbacks?: InterviewCallbacks;
  inlineErrors?: boolean;
};

const InterviewContext = createContext<InterviewContextState | undefined>(undefined);

type InterviewFormProps = PropsWithChildren<{
  formId: string;
  form?: ExposedFormControls;
  className?: string;
  onSubmit: (data: any) => void;
}>;

const InterviewForm = ({ formId, form, className, onSubmit, children }: InterviewFormProps) => {
  const methods = useForm(form);
  // const handleSubmit = methods.handleSubmit();
  const handleSubmit = (e: any) => {
    console.log("submit event");
    console.log("defaultPrevented before", e.defaultPrevented);

    methods.handleSubmit(
      (data) => {
        console.log("valid");
        onSubmit(data);
      },
      (errors) => console.log("invalid", errors)
    )(e);

    console.log("defaultPrevented after", e.defaultPrevented);
  };

  return (
    <FormProvider {...methods}>
      <form data-slot={"form"} className={cn("flex flex-1 min-h-0", className)} id={formId} onSubmit={handleSubmit}>
        {children}
      </form>
    </FormProvider>
  );
};

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
};

export type ExposedFormControls = Pick<UseFormProps, "mode" | "reValidateMode" | "shouldFocusError">;

export interface InterviewProviderProps extends PropsWithChildren, InterviewConfig {
  /**
   * The manager instance.
   *
   * **IMPORTANT** ensure the instance is not re-created each render
   */
  manager: SessionManager;
  /* Optional className to apply to the form element. */
  className?: string;
}

/**
 * InterviewProvider is a React context provider that manages the state and behavior of an interview session.
 * It provides methods to navigate through the interview steps, manage form values, and handle interactions.
 */
export const InterviewProvider = ({ manager, children, className, ...config }: InterviewProviderProps) => {
  const { form, theme, icons, slots, callbacks } = config;
  // Generate a unique form ID for this interview instance
  const formId = useId();
  const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);

  if (manager.isDebugEnabled()) {
    console.log("[InterviewProvider] Snapshot", snapshot);
  }

  const value = useMemo<InterviewContextState>(() => {
    const { session, state, error, loading } = snapshot;
    const buttons = session?.screen.buttons;
    // calculate and expose both of these for ease of use
    const validation = {
      error: session?.validations?.some(
        (validation) => validation.shown && validation.severity === "error",
      ) ?? false,
      warning: session?.validations?.some(
        (validation) => validation.shown && validation.severity === "warning",
      ) ?? false
    };
    // console.log("Validations fail:", validationsFail);
    const finished = manager.isLastStep && manager.isComplete;
    return {
      formId,
      manager,
      callbacks: callbacks ?? {},
      session: session!,
      state,
      error,
      validation,
      isLoading: loading,
      backDisabled: manager.isSubInterview ? false : buttons?.back === false || loading,
      nextDisabled:
        // only disable next on validation error
        validation.error ||
        (manager.isSubInterview ? false : buttons?.next === false) ||
        // !manager.canProgress ||
        (!manager.isSubInterview && finished) ||
        loading,
    };
  }, [formId, snapshot, manager, callbacks]);

  const options = useMemo(() => ({
    inlineErrors: config.inlineErrors ?? false,
    ...manager.options
  }), [config.inlineErrors, manager.options]);

  return (
    <OptionsProvider value={options}>
      <ThemeProvider
        theme={theme}
        icons={icons}
        controls={slots}
      >
        <InterviewContext.Provider value={value}>
          <AttributeNestingProvider value={false}>
            <InterviewForm
              key={snapshot.session?.screen?.id}
              formId={formId}
              form={form}
              className={className}
              onSubmit={(data) => manager.next(data)}
            >
              {children}
            </InterviewForm>
          </AttributeNestingProvider>
        </InterviewContext.Provider>
      </ThemeProvider>
    </OptionsProvider>
  );
};
