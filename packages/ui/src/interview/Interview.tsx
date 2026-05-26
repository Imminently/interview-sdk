
import { DebugSettingsProvider } from "@/providers";
import type { ManagerOptions } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { type PropsWithChildren, useState } from "react";
import { type InterviewConfig, InterviewProvider } from "./InterviewContext";
import { InterviewLayout } from "./InterviewLayout";
import { DebugPanel } from "@/components/debug";

export interface InterviewProps extends PropsWithChildren, InterviewConfig {
  options: ManagerOptions;
  readOnly?: boolean;
  /* Optional className to apply to the form element. */
  className?: string;

}

/**
 * A simple interview component that provides the interview context and layout.
 * It creates a new SessionManager instance and passes it to the InterviewProvider.
 */
export const Interview = ({ options, children, readOnly, ...props }: InterviewProps) => {
  const [manager] = useState(() => new SessionManager({ ...options, readOnly }));

  console.log("Interview render", { options, readOnly });

  return (
    <InterviewProvider
      manager={manager}
      {...props}
    >
      <DebugSettingsProvider>
        {children ? children : <InterviewLayout key={manager.session?.screen.id} />}
        {options.debug ? <DebugPanel /> : null}
      </DebugSettingsProvider>
    </InterviewProvider>
  );
};
