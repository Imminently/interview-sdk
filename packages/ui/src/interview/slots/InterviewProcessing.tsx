import { Progress } from "@/components/ui/progress";
import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useInterview } from "../InterviewContext";

export interface InterviewProcessingProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewProcessing = ({ asChild, children, className, ...props }: InterviewProcessingProps) => {
  const { isLoading } = useInterview();
  if (!isLoading) {
    return null; // Don't render if not in loading state
  }
  const Comp = asChild ? Slot : Progress;
  return (
    <Comp
      className={cn(className)}
      indeterminate
      {...props}
    >
      {/* @ts-ignore some issue with slot vs progress, will fix later */}
      {children}
    </Comp>
  );
};

export { InterviewProcessing };
