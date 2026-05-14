import { cn } from "@/util";
import { Slot } from "@radix-ui/react-slot";
import type * as React from "react";
import { useInterview } from "../InterviewContext";
import { InterviewBack } from "./InterviewBack";
import { InterviewForm } from "./InterviewForm";
import { InterviewNext } from "./InterviewNext";
import { InterviewValidations } from "./InterviewValidations";
import { InterviewTitle } from "./InterviewTitle";

export interface InterviewContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Renders the default interview layout for a successful session.
 *
 * The built-in layout includes {@link InterviewTitle}, {@link InterviewForm},
 * {@link InterviewValidations}, {@link InterviewBack}, and {@link InterviewNext}.
 * Provide children to replace that layout while keeping the surrounding interview context.
 */
export const InterviewContent = ({ asChild, children, className, ...props }: InterviewContentProps) => {
  const { state, session } = useInterview();
  if (state !== "success" || !session) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn("flex flex-1 flex-col gap-4", className)}
      data-slot="content"
      {...props}
    >
      <div data-slot="form" className="flex-1 overflow p-4 w-2xl mx-auto">
        <InterviewTitle />
        <InterviewForm />
      </div>
      <InterviewValidations />
      <div className="flex gap-2 items-center justify-between mt-8 border-t p-4">
        <InterviewBack />
        <InterviewNext />
      </div>
    </Comp>
  );
};
