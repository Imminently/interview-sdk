import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@//util";
import { useInterview } from "../InterviewContext";
export interface InterviewNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewNext = ({ asChild, children, className, ...props }: InterviewNextProps) => {
  const { handleSubmit } = useFormContext();
  const { manager, state, isLoading, nextDisabled } = useInterview();
  // do not display next if interview is finished
  const hide = !manager.isSubInterview && manager.isLastStep && manager.isComplete;
  if (state !== "success" || hide) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(className)}
      data-slot="next"
      slot-next=""
      type="button"
      disabled={nextDisabled}
      // @ts-ignore testing
      loading={isLoading}
      onClick={handleSubmit(manager.next)}
      {...props}
    >
      {children ?? "Next"}
    </Comp>
  );
};

export { InterviewNext };
