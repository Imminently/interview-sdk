import { describe, expect, test } from "bun:test";
import { screen } from "@testing-library/react";
import { createFakeManager } from "../test-utils/fakeManager";
import { interviewContainerControl, textControl } from "../test-utils/fixtures";
import { renderContainer } from "../test-utils/renderControl";

describe("InterviewContainer render", () => {
  test("shows a loading placeholder before the sub interview session is active", () => {
    const manager = createFakeManager({ overrides: { isSubInterview: false } });
    renderContainer(interviewContainerControl(), { manager });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  test("creates the sub interview exactly once", () => {
    const manager = createFakeManager({ overrides: { isSubInterview: false } });
    renderContainer(interviewContainerControl(), { manager });
    expect(manager.createSubInterview).toHaveBeenCalledTimes(1);
    expect(manager.createSubInterview).toHaveBeenCalledWith(interviewContainerControl());
  });

  test("shows an error state when the sub session resolves to the same screen as the parent", () => {
    const manager = createFakeManager({ overrides: { isSubInterview: true } });
    renderContainer(interviewContainerControl(), { manager });
    expect(screen.getByText("Error: Failed to load sub interview")).toBeInTheDocument();
  });

  test("renders the sub screen's title, progress, and controls once active", () => {
    const baseManager = createFakeManager();
    const subActiveSession = {
      ...(baseManager.session as any),
      screen: {
        title: "Sub screen title",
        id: "sub-screen-1",
        context: { entity: "global" },
        controls: [textControl({ id: "sub-child", attribute: "sub_child", label: "Sub child" })],
        attributes: [],
        allAttributes: [],
      },
      steps: [
        {
          id: "s1",
          title: "Step 1",
          context: { entity: "global" },
          current: false,
          complete: true,
          visited: true,
          skipped: false,
          visitable: true,
        },
        {
          id: "s2",
          title: "Step 2",
          context: { entity: "global" },
          current: true,
          complete: false,
          visited: false,
          skipped: false,
          visitable: true,
        },
        {
          id: "s3",
          title: "Step 3",
          context: { entity: "global" },
          current: false,
          complete: false,
          visited: false,
          skipped: true,
          visitable: false,
        },
      ],
    };
    const manager = createFakeManager({ overrides: { isSubInterview: true, activeSession: subActiveSession } });

    renderContainer(interviewContainerControl(), { manager });

    expect(screen.getByText("Sub screen title")).toBeInTheDocument();
    expect(screen.getByText("Sub child")).toBeInTheDocument();
    expect(screen.getByText("2 of 2 questions in this section")).toBeInTheDocument();
  });
});
