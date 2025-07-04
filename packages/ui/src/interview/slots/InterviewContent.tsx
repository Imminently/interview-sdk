import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/util";
import { InterviewForm } from "./InterviewForm";
import { InterviewBack } from "./InterviewBack";
import { InterviewNext } from "./InterviewNext";
import { useInterview } from "../InterviewContext";

export interface InterviewContentProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InterviewContent = ({ asChild, children, className, ...props }: InterviewContentProps) => {
  const { state, session } = useInterview();
  if (state !== "success" && !session) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn("flex flex-1 flex-col gap-4", className)}
      data-slot="content"
      slot-content=""
      {...props}
    >
      <InterviewForm className="flex-1 overflow p-4 w-2xl mx-auto" />
      <div className="flex gap-2 items-center justify-between mt-8 border-t p-4">
        <InterviewBack />
        <InterviewNext />
      </div>
    </Comp>
  );
};

export { InterviewContent };
