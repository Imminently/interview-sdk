import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/util";
import { useInterview } from "../InterviewContext";

export interface InterviewErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewError = ({ asChild, children, className, ...props }: InterviewErrorProps) => {
  const { state, error } = useInterview();
  if (state !== "error") {
    return null; // Don't render if not in error state
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn(className)}
      data-slot="error"
      slot-error=""
      {...props}
    >
      {children ?? error?.message ?? "Interview Error (default slot)"}
    </Comp>
  );
};

export { InterviewError };
