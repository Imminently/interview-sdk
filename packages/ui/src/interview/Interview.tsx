import InterviewDebugIndicator from "@/interview/InterviewDebugIndicator";
import { DebugSettingsProvider } from "@/providers";
import type { ManagerOptions } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { type PropsWithChildren, useState } from "react";
import { type InterviewConfig, InterviewProvider } from "./InterviewContext";
import { InterviewLayout } from "./InterviewLayout";

export interface InterviewProps extends PropsWithChildren, InterviewConfig {
  options: ManagerOptions;
  readOnly?: boolean;
}

/**
 * A simple interview component that provides the interview context and layout.
 * It creates a new SessionManager instance and passes it to the InterviewProvider.
 */
export const Interview = ({ options, children, readOnly, ...props }: InterviewProps) => {
  const [manager] = useState(() => new SessionManager({ ...options, readOnly }));

  return (
    <InterviewProvider
      manager={manager}
      {...props}
    >
      <DebugSettingsProvider>
        <InterviewDebugIndicator />
        {children ? children : <InterviewLayout key={manager.session?.screen.id} />}
      </DebugSettingsProvider>
    </InterviewProvider>
  );
};
