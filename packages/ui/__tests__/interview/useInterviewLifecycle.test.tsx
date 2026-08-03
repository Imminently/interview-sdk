import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import { InterviewProvider } from "../../src/interview/InterviewContext";
import {
  useInterviewActiveSessionChange,
  useInterviewComplete,
  useInterviewCreate,
  useInterviewError,
  useInterviewLifecycleEvent,
  useInterviewLoad,
  useInterviewReset,
  useInterviewSessionStart,
  useInterviewSessionUpdate,
} from "../../src/interview/useInterviewLifecycle";
import { createFakeManager } from "../test-utils/fakeManager";

// Renders the hook inside a real InterviewProvider + fake manager, rather than mock.module()-ing
// "react"/InterviewContext - mock.module() replaces the module in bun's registry for the rest of
// the process (not just this file), which previously broke other test files that resolved these
// modules for the first time after this file ran (e.g. a fresh render harness would get a
// `useInterview()` with no `activeSession`). Exercising the real provider avoids that entirely.
const renderHookWithManager = (hook: () => void, subscribe = mock((_: string, __: (e: unknown) => void) => mock())) => {
  const manager = createFakeManager({ overrides: { events: { subscribe } } });
  const Harness = () => {
    hook();
    return null;
  };
  const { unmount } = render(
    <InterviewProvider manager={manager}>
      <Harness />
    </InterviewProvider>,
  );
  return { subscribe, unmount };
};

describe("useInterviewLifecycleEvent", () => {
  test("exports all named hooks", () => {
    expect(typeof useInterviewLifecycleEvent).toBe("function");
    expect(typeof useInterviewCreate).toBe("function");
    expect(typeof useInterviewComplete).toBe("function");
    expect(typeof useInterviewError).toBe("function");
    expect(typeof useInterviewLoad).toBe("function");
    expect(typeof useInterviewReset).toBe("function");
    expect(typeof useInterviewSessionStart).toBe("function");
    expect(typeof useInterviewSessionUpdate).toBe("function");
    expect(typeof useInterviewActiveSessionChange).toBe("function");
  });

  test("subscribes to the named event when the effect runs", () => {
    const listener = mock(() => {});
    const { subscribe } = renderHookWithManager(() => useInterviewLifecycleEvent("sessionStart", listener));

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(subscribe.mock.calls[0][0]).toBe("sessionStart");
  });

  test("the wrapped handler calls the listener ref's current value", () => {
    const listener = mock(() => {});
    const { subscribe } = renderHookWithManager(() => useInterviewLifecycleEvent("create", listener));

    const wrappedHandler = subscribe.mock.calls[0][1] as (e: unknown) => void;
    wrappedHandler({ type: "create" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls as any)[0][0]).toEqual({ type: "create" });
  });

  test("returns the unsubscribe function as the effect cleanup", () => {
    const unsubscribe = mock(() => {});
    const subscribe = mock((_: string, __: (e: unknown) => void) => unsubscribe);
    const { unmount } = renderHookWithManager(
      () =>
        useInterviewLifecycleEvent(
          "load",
          mock(() => {}),
        ),
      subscribe,
    );

    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  test("named wrapper useInterviewSessionStart passes correct event name", () => {
    const { subscribe } = renderHookWithManager(() => useInterviewSessionStart(mock(() => {})));
    expect(subscribe.mock.calls[0][0]).toBe("sessionStart");
  });

  test("named wrapper useInterviewComplete passes correct event name", () => {
    const { subscribe } = renderHookWithManager(() => useInterviewComplete(mock(() => {})));
    expect(subscribe.mock.calls[0][0]).toBe("complete");
  });

  test("named wrapper useInterviewError passes correct event name", () => {
    const { subscribe } = renderHookWithManager(() => useInterviewError(mock(() => {})));
    expect(subscribe.mock.calls[0][0]).toBe("error");
  });
});
