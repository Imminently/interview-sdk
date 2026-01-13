import { useTheme } from "@/providers";
import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useInterview } from "../InterviewContext";

export interface InterviewLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// default loading is centered div with translated text form.loading
const DefaultLoading = ({ className }: InterviewLoadingProps) => {
  const { t } = useTheme();
  return (
    <div className={cn("flex flex-col items-center justify-center h-full", className)}>
      <p>{t("form.loading")}</p>
    </div>
  );
};

const InterviewLoading = ({ asChild, className, ...props }: InterviewLoadingProps) => {
  const { state, session } = useInterview();
  if (state !== "loading" || !!session) {
    return null; // Don't render if not in loading state or have the base session
  }
  const Comp = asChild ? Slot : DefaultLoading;
  return (
    <Comp
      className={cn(className)}
      data-slot="loading"
      slot-loading=""
      {...props}
    />
  );
};

export { InterviewLoading };
