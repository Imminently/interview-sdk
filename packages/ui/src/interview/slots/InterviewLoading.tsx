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
    <div className={cn("flex flex-col items-center justify-center w-full h-full", className)}>
      <p>{t("form.loading")}</p>
    </div>
  );
};

/**
 * Renders while the interview is performing its initial create or load operation.
 *
 * This only appears before a base session is available. Once a session exists, prefer
 * {@link InterviewProcessing} for in-flow async feedback.
 */
export const InterviewLoading = ({ asChild, className, ...props }: InterviewLoadingProps) => {
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
