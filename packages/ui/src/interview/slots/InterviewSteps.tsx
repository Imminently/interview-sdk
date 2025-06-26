import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/ui/util";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/ui/components/ui/sidebar";
import { Step } from "@/core";
import { useInterview } from "../InterviewContext";
import { Badge } from "@/ui/components/ui/badge";
import { CheckIcon } from "lucide-react";
import { InterviewProgress } from "./InterviewProgress";

export interface InterviewStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const getVariant = (step: Step) => {
  if (step.current) return "default";
  if (step.complete) return "success";
  if (step.visited) return "muted";
  if (step.skipped) return "ghost";
  return "secondary";
}

const DefaultSteps = () => {
  const { session } = useInterview();
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Steps</SidebarGroupLabel>
          <SidebarMenu>
            {session?.steps.filter(s => s.visited || s.current).map((item, index) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton tooltip={item.title}>
                  <Badge variant={getVariant(item)} className="rounded-full">
                    {index + 1}
                  </Badge>
                  <span className="truncate">{item.title}</span>
                  {item.complete ? <CheckIcon className="h4 w-4 ml-auto" /> : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 group-data-[collapsible=icon]:hidden">
        <InterviewProgress />
      </SidebarFooter>
    </Sidebar>
  )
}

const InterviewSteps = ({ asChild, children, className, ...props }: InterviewStepsProps) => {
  const { state, session } = useInterview();
  if (state !== "success" && !session) {
    return null; // Don't render if not in success state
  }
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={cn(className)}
      data-slot="steps"
      slot-steps=""
      {...props}
    >
      {children ?? <DefaultSteps />}
    </Comp>
  );
};

export { InterviewSteps };
