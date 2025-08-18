import type { ManagerOptions } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { type PropsWithChildren, useState } from "react";
import {
  type InterviewConfig,
  InterviewProvider
} from "./InterviewContext";
import { InterviewLayout } from "./InterviewLayout";
import { DebugSettingsProvider } from "@/providers";

export interface InterviewProps extends PropsWithChildren, InterviewConfig {
  options: ManagerOptions;
}

/**
 * A simple interview component that provides the interview context and layout.
 * It creates a new SessionManager instance and passes it to the InterviewProvider.
 */
export const Interview = ({
  options,
  children,
  ...props
}: InterviewProps) => {
  const [manager] = useState(() => new SessionManager(options));

  return (
    <DebugSettingsProvider initialDebug={options?.debug}>

    <InterviewProvider manager={manager} {...props}>
      {children ? (
        children
      ) : (
        <InterviewLayout key={manager.session?.screen.id} />
      )}
    </InterviewProvider>
    </DebugSettingsProvider>
  );
};
