import { createContext, PropsWithChildren, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { Session, ManagerOptions, ManagerState } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { IconMap, InterviewControls, Theme, ThemeProvider } from "../providers/ThemeProvider";
import { AttributeNestingProvider } from "@/providers";
import { InterviewLayout } from "./InterviewLayout";

export type InterviewContextState = {
  manager: SessionManager;
  session: Session;
  state: ManagerState;
  error?: Error;
  isLoading: boolean;
  backDisabled: boolean;
  nextDisabled: boolean;
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

  const value = useMemo<InterviewContextState>(() => {
    const { session, state, error, loading } = snapshot;
    const buttons = session?.screen.buttons;
    const finished = manager.isLastStep && manager.isComplete;
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
    };
  }, [snapshot]);

  const { session } = snapshot;

  // note children needs encapsulating <></>
  // workaround for react 19, as react-hook-form appears to still be using react 18 which breaks the ReactNode type

  return (
    <ThemeProvider theme={theme} icons={icons} controls={slots}>
      <InterviewContext.Provider value={value}>
        <AttributeNestingProvider value={false}>
          <FormProvider {...methods}>
            {
              children ? <>{children}</> : <InterviewLayout key={session?.screen.id} options={options} />
            }
          </FormProvider>
        </AttributeNestingProvider>
      </InterviewContext.Provider>
    </ThemeProvider>
  );
};
