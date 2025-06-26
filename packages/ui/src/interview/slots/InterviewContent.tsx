import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/ui/util";
import { InterviewForm } from "./InterviewForm";
import { SidebarInset } from "@/ui/components/ui/sidebar";
import { InterviewBack } from "./InterviewBack";
import { Button } from "@/ui/components/ui/button";
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
      {children ?? (
        <SidebarInset>
          <InterviewForm className="flex-1 overflow p-4 w-2xl mx-auto" />
          <div className="flex gap-2 items-center justify-between mt-8 border-t p-4">
            <InterviewBack asChild>
              <Button variant="outline">Back</Button>
            </InterviewBack>
            <InterviewNext asChild>
              <Button>Next</Button>
            </InterviewNext>
          </div>
        </SidebarInset>
      )}
    </Comp>
  );
};

export { InterviewContent };
