import { useTheme } from "@/providers";
import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useInterview } from "../InterviewContext";

export interface InterviewErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// default loading is centered div with translated text form.loading
const DefaultError = ({ children, className }: InterviewErrorProps) => {
  const { t } = useTheme();
  return (
    <div className={cn("flex flex-col items-center justify-center h-full gap-2", className)}>
      <h4>{t("form.error")}</h4>
      <p>{children}</p>
    </div>
  );
};

const InterviewError = ({ asChild, children, className, ...props }: InterviewErrorProps) => {
  const { state, error } = useInterview();
  if (state !== "error") {
    return null; // Don't render if not in error state
  }
  const Comp = asChild ? Slot : DefaultError;
  return (
    <Comp
      className={cn(className)}
      data-slot="error"
      slot-error=""
      {...props}
    >
      {children ?? error?.message}
    </Comp>
  );
};

export { InterviewError };
