import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/util";
import { useInterview } from "../InterviewContext";
import { useTheme } from "@/providers";
import { Button } from "@/components/ui/button";

export interface InterviewNextProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewNext = ({ asChild, children, className, ...props }: InterviewNextProps) => {
  const { handleSubmit } = useFormContext();
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
      type="button"
      disabled={nextDisabled}
      // @ts-ignore testing
      loading={isLoading}
      onClick={handleSubmit(manager.next)}
      {...props}
    >
      {children ?? t("form.next")}
    </Comp>
  );
};

export { InterviewNext };
