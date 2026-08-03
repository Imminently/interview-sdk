import { expect } from "bun:test";
import type { Control, SessionManager, Validation } from "@imminently/interview-sdk";
import { render } from "@testing-library/react";
import { RenderControl } from "../../src/components/RenderControl";
import { InterviewProvider } from "../../src/interview/InterviewContext";
import { createFakeManager } from "./fakeManager";

export type RenderControlOptions = {
  manager?: SessionManager;
  validations?: Validation[];
  inlineErrors?: boolean;
};

/**
 * Renders a control through the real production tree (InterviewProvider -> RenderControl),
 * backed by a fake SessionManager, so tests exercise the same wiring (attribute-to-fieldname,
 * readOnly resolution, validation schema, defaultValue precedence) that production uses.
 *
 * inlineErrors defaults to true here (production default is false) so seeding `validations`
 * deterministically surfaces a field error via FormMessage.
 */
export const renderControl = (control: Control, opts: RenderControlOptions = {}) => {
  const manager =
    opts.manager ??
    createFakeManager({
      screen: { controls: [control] },
      validations: opts.validations ?? [],
    });

  const utils = render(
    <InterviewProvider
      manager={manager}
      inlineErrors={opts.inlineErrors ?? true}
    >
      <RenderControl control={control} />
    </InterviewProvider>,
  );

  expectNoRenderError(utils.container);

  return { ...utils, manager };
};

// Containers dispatch through RenderControl too - same harness, kept as a distinct name for
// readability in container test files.
export const renderContainer = renderControl;

/**
 * RenderControl wraps every control in an ErrorBoundary, so a missing fake-manager method or a
 * thrown error renders a "Failed to render control" fallback box instead of crashing the test.
 * Fail loudly with the real error message rather than a confusing DOM-shape mismatch.
 */
export const expectNoRenderError = (container: HTMLElement) => {
  const fallback = container.querySelector('[class*="bg-red-100"]');
  if (fallback) {
    throw new Error(`Control failed to render: ${fallback.textContent}`);
  }
  expect(fallback).toBeNull();
};
