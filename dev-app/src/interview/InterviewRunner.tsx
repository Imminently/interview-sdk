import { Interview, SidebarInset, SidebarProvider } from "@imminently/interview-ui";
import { useMemo } from "react";
import { getInterviewConfig } from "./config";
import { InterviewError } from "./InterviewError";
import { NavHeader } from "./NavHeader";

/** Runs one interview: `project` is the project (model) id, `interview` its name. */
export const InterviewRunner = ({
  project,
  interview,
}: {
  project: string;
  interview: string;
}) => {
  const options = useMemo(
    () => getInterviewConfig({ project, interview }),
    [project, interview],
  );

  return (
    <Interview options={options} inlineErrors>
      <InterviewError />
      <Interview.Loading />
      <SidebarProvider>
        <Interview.Steps />
        <SidebarInset>
          <NavHeader interview={interview} />
          <Interview.Content />
        </SidebarInset>
      </SidebarProvider>
    </Interview>
  );
};
