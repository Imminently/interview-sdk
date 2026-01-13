import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useFormContext } from "react-hook-form";
import { useInterview } from "../InterviewContext";

export interface InterviewSaveProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * @EXPERIMENTAL Save button for the interview form.
 */
const InterviewSave = ({ asChild, children, className, ...props }: InterviewSaveProps) => {
  const { handleSubmit, trigger, getValues } = useFormContext();
  const { t } = useTheme();
  const { manager, state, isLoading } = useInterview();
  if (state !== "success") {
    return null; // Don't render if not in success state
  }

  const handleSave = async () => {
    const isValid = await trigger(undefined, {
      shouldFocus: false,
      // resolver: {
      //   context: { partial: true },
      // },
    });

    if (!isValid) return;

    const values = getValues();
    manager.save(values);
  }

  const Comp = asChild ? Slot : Button;
  return (
    <Comp
      className={cn(className)}
      data-slot="save"
      slot-save=""
      type="button"
      // @ts-ignore testing
      loading={isLoading}
      onClick={handleSave}
      {...props}
    >
      {children ?? t("form.save")}
    </Comp>
  );
};

export { InterviewSave };
