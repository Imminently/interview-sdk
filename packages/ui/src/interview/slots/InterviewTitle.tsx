import { useTheme } from "@/providers";
import { cn } from "@/util";
import { type Step, getCurrentStep } from "@imminently/interview-sdk";
import { Slot } from "@radix-ui/react-slot";
import type React from "react";
import { useInterview } from "../InterviewContext";

const DEFAULT_STEP: Step = {
  complete: false,
  context: { entity: "" },
  current: false,
  id: "",
  skipped: false,
  title: "",
  visitable: true,
  visited: false,
  steps: [],
};

export interface InterviewTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

/**
 * Renders the current screen title, falling back to the active step title when needed.
 *
 * @example
 * <Interview.Title asChild>
 *   <h1 className="text-3xl font-serif" />
 * </Interview.Title>
 */
export const InterviewTitle = ({ asChild, children, className, ...props }: InterviewTitleProps) => {
  const { t } = useTheme();
  const { session } = useInterview();
  const { steps, screen } = session;

  if (!screen) return null;

  const step = getCurrentStep({ ...DEFAULT_STEP, steps });
  const pageTitle = t(screen.title || step?.title || "");
  const Comp = asChild ? Slot : "h4";

  return (
    <Comp
      {...props}
      data-slot="heading"
      className={cn("text-2xl font-semibold mb-6", className)}
    >
      {children ?? pageTitle}
    </Comp>
  );
};