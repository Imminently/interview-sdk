import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/ui/util";
import { useInterview } from "../InterviewContext";

export interface InterviewLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewLoading = ({ asChild, children, className, ...props }: InterviewLoadingProps) => {
  const { state, session } = useInterview();
  if (state !== "loading" || !!session) {
    return null; // Don't render if not in loading state or have the base session
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn(className)}
      data-slot="loading"
      slot-loading=""
      {...props}
    >
      {children ?? "Interview Loading (default slot)"}
    </Comp>
  );
};

export { InterviewLoading };
