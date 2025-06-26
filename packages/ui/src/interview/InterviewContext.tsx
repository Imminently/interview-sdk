import React, { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { Session, ControlsValue, ManagerOptions, ManagerState } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { IconMap, InterviewControls, Theme, ThemeProvider } from "../providers/ThemeProvider";
import InterviewDebugPanel from "./InterviewDebugPanel";
import { AttributeNestingProvider } from "@//providers";
import { InterviewLayout } from "./InterviewLayout";

export type InterviewContextState = {
  manager: SessionManager;
  session: Session;
  state: ManagerState;
  error?: Error;
  isLoading: boolean;
  backDisabled: boolean;
  nextDisabled: boolean;
  setFormValues: (values: ControlsValue) => void;
}

const InterviewContext = createContext<InterviewContextState | undefined>(undefined);

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error("useInterview must be used within InterviewProvider");
  return ctx;
};

export interface InterviewProviderProps extends PropsWithChildren {
  options: ManagerOptions;
  theme?: Theme;
  icons?: IconMap;
  slots?: Partial<InterviewControls>;
};

/**
 * InterviewProvider is a React context provider that manages the state and behavior of an interview session.
 * It provides methods to navigate through the interview steps, manage form values, and handle interactions.
 */
export const InterviewProvider = ({ options, theme, icons, slots, children }: InterviewProviderProps) => {
  const methods = useForm();
  const [manager] = useState(() => new SessionManager(options));
  const snapshot = useSyncExternalStore(manager.subscribe, manager.getSnapshot);

  if (options.debug) {
    console.log("[InterviewProvider] Snapshot", snapshot);
  }

  // TODO form reset on screen change?

  // TODO where and why is this used?
  const setFormValues = useCallback((values: ControlsValue) => {
    // formMethods.current?.reset(values);
    methods.reset(values);
  }, []);

  const value = useMemo<InterviewContextState>(() => {
    const { session, state, error, loading } = snapshot;
    const buttons = session?.screen.buttons;
    const finished = manager.isLastStep && manager.isComplete;
    // console.log("[InterviewProvider] value", {
    //   sessionId: session?.interviewId,
    //   state,
    //   error,
    //   loading,
    //   finished,
    //   isSubInterview: manager.isSubInterview,
    //   isLastStep: manager.isLastStep,
    //   isComplete: manager.isComplete,
    //   isLoading: loading,
    //   buttons,
    // });
    return {
      manager,
      session: session!,
      state,
      error,
      isLoading: loading,
      backDisabled:
        manager.isSubInterview ? false : buttons?.back === false ||
          loading,
      nextDisabled:
        manager.isSubInterview ? false : buttons?.next === false ||
          // !manager.canProgress ||
          (!manager.isSubInterview && finished) ||
          loading,
      setFormValues,
    };
  }, [snapshot, setFormValues]);

  const { session } = snapshot;

  return (
    <ThemeProvider theme={theme} icons={icons} controls={slots}>
      <InterviewContext.Provider value={value}>
        <AttributeNestingProvider value={false}>
          <FormProvider {...methods}>
            {children ?? <InterviewLayout key={session?.screen.id} />}
            {options.debug ? <InterviewDebugPanel /> : null}
          </FormProvider>
        </AttributeNestingProvider>
      </InterviewContext.Provider>
    </ThemeProvider>
  );
};
