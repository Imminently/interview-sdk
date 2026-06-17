import { describe, expect, mock, test } from "bun:test";

// -- Mocks must be declared before the dynamic import --

const mockUnsubscribe = mock(() => {});
const mockSubscribe = mock((_eventName: string, _handler: Function) => mockUnsubscribe);
const mockManager = { events: { subscribe: mockSubscribe } };

mock.module("../../src/interview/InterviewContext", () => ({
  useInterview: () => ({ manager: mockManager }),
}));

// Capture effects so we can run them manually instead of relying on a DOM
const capturedEffects: Array<() => void | (() => void)> = [];
const capturedRefs: Array<{ current: unknown }> = [];
let refCallCount = 0;

mock.module("react", () => ({
  useEffect: (fn: () => void | (() => void), _deps?: unknown[]) => {
    capturedEffects.push(fn);
  },
  useRef: (initial: unknown) => {
    const ref = { current: initial };
    capturedRefs[refCallCount++] = ref;
    return ref;
  },
}));

const { useInterviewLifecycleEvent, useInterviewCreate, useInterviewComplete, useInterviewError, useInterviewLoad, useInterviewReset, useInterviewSessionStart, useInterviewSessionUpdate, useInterviewActiveSessionChange } =
  await import("../../src/interview/useInterviewLifecycle");

const runEffects = () => {
  const cleanups: Array<() => void> = [];
  for (const effect of capturedEffects) {
    const cleanup = effect();
    if (typeof cleanup === "function") cleanups.push(cleanup);
  }
  capturedEffects.length = 0;
  return cleanups;
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
    mockSubscribe.mockClear();
    const listener = mock(() => {});

    useInterviewLifecycleEvent("sessionStart", listener);
    runEffects();

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe.mock.calls[0][0]).toBe("sessionStart");
  });

  test("the wrapped handler calls the listener ref's current value", () => {
    mockSubscribe.mockClear();
    const listener = mock(() => {});

    useInterviewLifecycleEvent("create", listener);
    runEffects();

    const wrappedHandler = mockSubscribe.mock.calls[0][1] as (e: unknown) => void;
    wrappedHandler({ type: "create" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls as any)[0][0]).toEqual({ type: "create" });
  });

  test("returns the unsubscribe function as the effect cleanup", () => {
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();

    useInterviewLifecycleEvent("load", mock(() => {}));
    const cleanups = runEffects();

    expect(cleanups).toHaveLength(1);
    cleanups[0]();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  test("named wrapper useInterviewSessionStart passes correct event name", () => {
    mockSubscribe.mockClear();
    useInterviewSessionStart(mock(() => {}));
    runEffects();
    expect(mockSubscribe.mock.calls[0][0]).toBe("sessionStart");
  });

  test("named wrapper useInterviewComplete passes correct event name", () => {
    mockSubscribe.mockClear();
    useInterviewComplete(mock(() => {}));
    runEffects();
    expect(mockSubscribe.mock.calls[0][0]).toBe("complete");
  });

  test("named wrapper useInterviewError passes correct event name", () => {
    mockSubscribe.mockClear();
    useInterviewError(mock(() => {}));
    runEffects();
    expect(mockSubscribe.mock.calls[0][0]).toBe("error");
  });
});
