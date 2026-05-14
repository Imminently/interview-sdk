import type { ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import { useInterview } from "../InterviewContext";

export interface InterviewNextProps extends ButtonProps {
  asChild?: boolean;
  children?: ReactNode;
  className?: string;
}

/**
 * Renders the primary submit action for the active interview form.
 *
 * This component does not call `manager.next()` directly. Instead it renders a submit button
 * for the provider-owned form, so it should be used within {@link Interview}.
 *
 * @example
 * <Interview.Next asChild>
 *   <button className="btn btn-primary">Continue</button>
 * </Interview.Next>
 */
export const InterviewNext = ({ asChild, children, className, ...props }: InterviewNextProps) => {
  const { t } = useTheme();
  const { manager, state, isLoading, nextDisabled } = useInterview();
  // do not display next if interview is finished
  const hide = !manager.isSubInterview && manager.isLastStep && manager.isComplete;
  if (state !== "success" || hide) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      className={cn(className)}
      data-slot="next"
      slot-next=""
      type="submit"
      disabled={nextDisabled}
      // @ts-ignore testing
      loading={isLoading}
      {...props}
    >
      {children ?? t("form.next")}
    </Comp>
  );
};
