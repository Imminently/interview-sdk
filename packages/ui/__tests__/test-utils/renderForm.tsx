import type { Control, SessionManager } from "@imminently/interview-sdk";
import { fireEvent, render, screen } from "@testing-library/react";
import { RenderControl } from "../../src/components/RenderControl";
import { InterviewProvider } from "../../src/interview/InterviewContext";
import { createFakeManager } from "./fakeManager";

export type RenderFormOptions = {
  manager?: SessionManager;
};

/**
 * Renders multiple controls inside a single real InterviewProvider <form>, with a submit button,
 * so tests can exercise the actual submit -> validate -> focus-first-error flow end to end.
 */
export const renderForm = (controls: Control[], opts: RenderFormOptions = {}) => {
  const manager = opts.manager ?? createFakeManager({ screen: { controls } });

  const utils = render(
    <InterviewProvider
      manager={manager}
      inlineErrors={true}
    >
      {controls.map((control) => (
        <RenderControl
          key={control.id}
          control={control}
        />
      ))}
      <button type="submit">Next</button>
    </InterviewProvider>,
  );

  const submit = () => fireEvent.click(screen.getByText("Next"));

  return { ...utils, manager, submit };
};
