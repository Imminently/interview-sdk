import type {
  ManagerState,
  Session,
  SessionManager,
} from "@imminently/interview-sdk";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { FormProvider, type UseFormProps, useForm } from "react-hook-form";
import { AttributeNestingProvider, OptionsProvider } from "@/providers";
import {
  type IconMap,
  type InterviewControls,
  type Theme,
  ThemeProvider,
} from "../providers/ThemeProvider";

export type InterviewContextState = {
  manager: SessionManager;
  session: Session;
  state: ManagerState;
  error?: Error;
  readOnly?: boolean;
  isLoading: boolean;
  backDisabled: boolean;
  nextDisabled: boolean;
};

/** Base user configurable controls for the interview. */
export type InterviewConfig = {
  /** Exposed limited set of props from `react-hook-form` */
  form?: ExposedFormControls;
  theme?: Theme;
  icons?: IconMap;
  slots?: Partial<InterviewControls>;
  /** Force all controls into readOnly */
  readOnly?: boolean;
};

const InterviewContext = createContext<InterviewContextState | undefined>(undefined);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
};

export type ExposedFormControls = Pick<UseFormProps, 'mode' | 'reValidateMode' | 'shouldFocusError'>;

export interface InterviewProviderProps extends PropsWithChildren, InterviewConfig {
  /**
   * The manager instance.
   *
   * **IMPORTANT** ensure the instance is not re-created each render
   */
  manager: SessionManager;
};

/**
 * InterviewProvider is a React context provider that manages the state and behavior of an interview session.
 * It provides methods to navigate through the interview steps, manage form values, and handle interactions.
 */
export const InterviewProvider = ({ manager, children, ...config }: InterviewProviderProps) => {
  const { form, theme, icons, slots, readOnly } = config;
  const methods = useForm(form);
  const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);

  if (manager.debug) {
    console.log("[InterviewProvider] Snapshot", snapshot);
  }

  const value = useMemo<InterviewContextState>(() => {
    const { session, state, error, loading } = snapshot;
    const buttons = session?.screen.buttons;
    const validationsFail = session?.validations?.some(
      (validation) => validation.shown && validation.severity === "error",
    );
    console.log("Validations fail:", validationsFail);
    const finished = manager.isLastStep && manager.isComplete;
    return {
      manager,
      session: session!,
      state,
      error,
      isLoading: loading,
      readOnly,
      backDisabled: manager.isSubInterview
        ? false
        : buttons?.back === false || loading,
      nextDisabled:
        validationsFail ||
        (manager.isSubInterview ? false : buttons?.next === false) ||
        // !manager.canProgress ||
        (!manager.isSubInterview && finished) ||
        loading,
    };
  }, [snapshot, readOnly, manager]);

  return (
    <OptionsProvider value={manager.options}>
      <ThemeProvider theme={theme} icons={icons} controls={slots}>
        <InterviewContext.Provider value={value}>
          <AttributeNestingProvider value={false}>
            <FormProvider {...methods}>{children}</FormProvider>
          </AttributeNestingProvider>
        </InterviewContext.Provider>
      </ThemeProvider>
    </OptionsProvider>
  );
};
