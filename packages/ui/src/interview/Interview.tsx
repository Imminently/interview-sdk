import { PropsWithChildren, useState } from "react";
import type { ManagerOptions } from "@imminently/interview-sdk";
import { SessionManager } from "@imminently/interview-sdk";
import { IconMap, InterviewControls, Theme } from "../providers/ThemeProvider";
import { InterviewLayout } from "./InterviewLayout";
import { ExposedFormControls, InterviewProvider } from "./InterviewContext";

export interface InterviewProps extends PropsWithChildren {
  options: ManagerOptions;
  /** Exposed limited set of props from `react-hook-form` */
  form?: ExposedFormControls;
  theme?: Theme;
  icons?: IconMap;
  slots?: Partial<InterviewControls>;
};

/**
 * A simple interview component that provides the interview context and layout.
 * It creates a new SessionManager instance and passes it to the InterviewProvider.
 */
export const Interview = ({ options, form, theme, icons, slots, children }: InterviewProps) => {
  const [manager] = useState(() => new SessionManager(options));

  return (
    <InterviewProvider manager={manager} form={form} theme={theme} icons={icons} slots={slots}>
      {
        children ? children : <InterviewLayout key={manager.session?.screen.id} />
      }
    </InterviewProvider>
  );
};
