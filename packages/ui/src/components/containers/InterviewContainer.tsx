import { useEffect } from "react";
import type { RenderableInterviewContainerControl } from "@/core";
import { useInterview } from "@/ui";
import { RenderControl } from "../RenderControl";

export const InterviewContainer = ({ control }: { control: RenderableInterviewContainerControl }) => {
  const { session, manager } = useInterview();

  // TODO this needs to create a new session if it doesn't exist already
  // if we have the session, we effectively want to render the Controls component
  // maybe we should add an option to control around display page title
  // This means next and back buttons should be handled by the parent
  // we will NOT render the sub interview steps

  // TODO modify the container to instead get an id back and render the session screen using that id
  // this would then support n nested interviews
  const isSubInterview = manager.isSubInterview;
  console.log('[interview container]', { isSubInterview, session, control });
  // no dependencies here, we only want to run this once
  useEffect(() => {
    // if the session interivewId does not match, we need to create the new one
    // @ts-ignore TODO interviewId is defined just not on the type
    if (!isSubInterview) {
      // TODO is there an async issue here to solve? maybe use setEnclosedState?
      console.log('Creating sub interview for control', control);
      manager.createSubInterview(control);
    }
  }, []);

  if (!isSubInterview) {
    // render loading component
    return (
      <div data-slot={"sub-controls"} className="flex flex-col gap-4">
        <p>Loading...</p>
      </div>
    )
  }

  const { steps, screen } = session;
  const { controls, title } = screen;

  // we want to convert steps into a 1 of x progress indicator
  // const current = steps.find(step => step.id === activeSession.screen.id);
  const filtered = steps.filter(step => !step.skipped);
  const progress = {
    current: filtered.findIndex((s) => s.current) + 1,
    total: filtered.length,
  };

  return (
    <>
      <div>
        <p>{progress.current} of {progress.total} questions in this section</p>
      </div>
      <h5 data-slot={"heading"} className="text-xl font-semibold">
        {title}
      </h5>
      <div data-slot={"sub-controls"} className="flex flex-col gap-4">
        {controls.map((control, index) => <RenderControl key={`${index}-${control.id}`} control={control} />)}
      </div>
    </>
  );
};
