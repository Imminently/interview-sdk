import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/ui/util";
import { useInterview } from "../InterviewContext";
import { Progress } from "@/ui/components/ui/progress";

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
      {children}
    </Comp>
  );
};

export { InterviewProcessing };
