import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@//util";
import { useInterview } from "../InterviewContext";

export interface InterviewBackProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewBack = ({ asChild, children, className, ...props }: InterviewBackProps) => {
  const { manager, state, backDisabled } = useInterview();
  // do not display back if interview is finished
  const hide = !manager.isSubInterview && manager.isLastStep && manager.isComplete;
  if (state !== "success" || hide) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(className)}
      data-slot="back"
      slot-back=""
      type="button"
      disabled={backDisabled}
      onClick={manager.back} // Call back function on button click
      {...props}
    >
      {children ?? "Back"}
    </Comp>
  );
};

export { InterviewBack };
