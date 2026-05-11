import { Button } from "@/components/ui/button";
import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useInterview } from "../InterviewContext";

export interface InterviewResetProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewReset = ({ asChild, children, className, ...props }: InterviewResetProps) => {
  const { manager, state, isLoading } = useInterview();

  if (state !== "success") {
    return null;
  }

  const Comp = asChild ? Slot : Button;

  return (
    <Comp
      className={cn(className)}
      data-slot="reset"
      slot-reset=""
      type="button"
      variant="outline"
      // @ts-ignore testing
      loading={isLoading}
      onClick={() => {
        void manager.reset();
      }}
      {...props}
    >
      {children ?? "Reset"}
    </Comp>
  );
};

export { InterviewReset };