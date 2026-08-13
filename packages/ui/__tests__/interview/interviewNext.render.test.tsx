import { describe, expect, test } from "bun:test";
import type { Control } from "@imminently/interview-sdk";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RenderControl } from "../../src/components/RenderControl";
import { InterviewProvider } from "../../src/interview/InterviewContext";
import { InterviewNext } from "../../src/interview/slots/InterviewNext";
import { createFakeManager } from "../test-utils/fakeManager";
import { numberControl } from "../test-utils/fixtures";

const renderNext = (
  manager: ReturnType<typeof createFakeManager>,
  controls: Control[] = [numberControl({ required: true })],
) =>
  render(
    <InterviewProvider
      manager={manager}
      inlineErrors={true}
    >
      {controls.map((c) => (
        <RenderControl
          key={c.id}
          control={c}
        />
      ))}
      <InterviewNext />
    </InterviewProvider>,
  );

describe("InterviewNext render", () => {
  test("renders a submit button with the translated default label", () => {
    renderNext(createFakeManager());
    const button = screen.getByRole("button", { name: "Next" });
    expect(button).toHaveAttribute("type", "submit");
  });

  test("is not disabled when there are no session-level blockers", () => {
    renderNext(createFakeManager());
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  // This is the core WCAG report finding: the submit button must stay enabled through a
  // client-side ("this field is required") validation failure, so the user can immediately
  // fix the field and try again - it should never look like the form is stuck submitting.
  test("stays enabled through a client-side validation failure and fix", async () => {
    const control = numberControl({ id: "c-number", attribute: "age", required: true });
    const manager = createFakeManager({ screen: { controls: [control] } });
    renderNext(manager, [control]);

    const button = screen.getByRole("button", { name: "Next" });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    await waitFor(() => expect(document.activeElement?.tagName).toBe("INPUT"));
    expect(button).not.toBeDisabled();
    expect(manager.next).not.toHaveBeenCalled();

    fireEvent.change(document.activeElement as HTMLInputElement, { target: { value: "25" } });
    fireEvent.click(button);
    await waitFor(() => expect(manager.next).toHaveBeenCalledTimes(1));
    expect(button).not.toBeDisabled();
  });

  test("is disabled when the session has a shown validation error", () => {
    const manager = createFakeManager({
      validations: [{ id: "v1", message: "err", severity: "error", attributes: ["age"], shown: true }],
    });
    renderNext(manager);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  test("is not disabled when a validation error exists but is not shown", () => {
    const manager = createFakeManager({
      validations: [{ id: "v1", message: "err", severity: "error", attributes: ["age"], shown: false }],
    });
    renderNext(manager);
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
  });

  test("is disabled when the screen explicitly disables next", () => {
    const control = numberControl();
    const manager = createFakeManager({ screen: { controls: [control], buttons: { next: false, back: true } } });
    renderNext(manager, [control]);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  test("is disabled while the manager is loading", () => {
    const base = createFakeManager();
    // useSyncExternalStore requires a stable snapshot reference across calls, so compute it once
    // rather than returning a fresh object from getSnapshot() on every call.
    const loadingSnapshot = { ...base.getSnapshot(), loading: true };
    const manager = { ...base, getSnapshot: () => loadingSnapshot } as typeof base;
    renderNext(manager);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  test("renders nothing while the manager is not in a success state", () => {
    const base = createFakeManager();
    const loadingSnapshot = { ...base.getSnapshot(), state: "loading" as const };
    const manager = { ...base, getSnapshot: () => loadingSnapshot } as typeof base;
    renderNext(manager);
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  test("renders nothing once the interview is finished", () => {
    const manager = createFakeManager({ overrides: { isLastStep: true, isComplete: true } });
    renderNext(manager);
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  test("still renders when a sub-interview is finished (finished check is skipped for sub-interviews)", () => {
    const manager = createFakeManager({ overrides: { isSubInterview: true, isLastStep: true, isComplete: true } });
    renderNext(manager);
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });
});
