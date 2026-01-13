import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTheme } from "@/providers";
import type { Step } from "@imminently/interview-sdk";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { useInterview } from "../InterviewContext";
import { InterviewProgress } from "./InterviewProgress";

export interface InterviewStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const getVariant = (step: Step) => {
  if (step.current) return "default";
  if (step.complete) return "success";
  if (step.visited) return "muted";
  if (step.skipped) return "ghost";
  return "secondary";
};

const DefaultSteps = ({ className }: InterviewStepsProps) => {
  const { t } = useTheme();
  const { session } = useInterview();
  return (
    <Sidebar className={className}>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{t("form.steps")}</SidebarGroupLabel>
          <SidebarMenu>
            {session?.steps
              .filter((s) => s.visited || s.current)
              .map((item, index) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton tooltip={t(item.title)}>
                    <Badge
                      variant={getVariant(item)}
                      className="rounded-full"
                    >
                      {index + 1}
                    </Badge>
                    <span className="truncate">{t(item.title)}</span>
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
  );
};

const InterviewSteps = (props: InterviewStepsProps) => {
  const { state, session } = useInterview();
  if (state !== "success" && !session) {
    return null; // Don't render if not in success state
  }
  // keep it simple and just render the default steps
  return <DefaultSteps {...props} />;
};

export { InterviewSteps };
