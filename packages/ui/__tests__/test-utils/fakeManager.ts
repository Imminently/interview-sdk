import { mock } from "bun:test";
import type { Control, Screen, Session, SessionManager, Validation } from "@imminently/interview-sdk";

export type FakeManagerOptions = {
  session?: Partial<Session>;
  screen?: Partial<Screen>;
  validations?: Validation[];
  managerOptions?: Record<string, any>;
  overrides?: Record<string, any>;
};

const buildScreen = (controls: Control[], overrides: Partial<Screen> = {}): Screen => ({
  title: "Test screen",
  id: "screen-1",
  context: { entity: "global" },
  controls,
  attributes: [],
  allAttributes: [],
  ...overrides,
});

const buildSession = (opts: FakeManagerOptions): Session => ({
  sessionId: "session-1",
  interactionId: "interaction-1",
  interviewId: "interview-1",
  goal: "test-goal",
  model: "test-model",
  release: "test-release",
  reportId: "report-1",
  status: "in-progress",
  context: { entity: "global" },
  data: { "@parent": undefined },
  steps: [],
  explanations: {},
  validations: opts.validations ?? [],
  screen: buildScreen((opts.screen?.controls as Control[]) ?? [], opts.screen),
  ...opts.session,
});

/**
 * Builds a minimal duck-typed SessionManager for rendering tests. The real class requires a
 * live ApiManager/FileManager, so this only implements the subset of the interface the render
 * path (InterviewProvider -> RenderControl -> controls/containers) actually touches.
 */
export const createFakeManager = (opts: FakeManagerOptions = {}): SessionManager => {
  const listeners = new Set<() => void>();
  const session = buildSession(opts);
  const snapshot = { state: "success" as const, error: undefined, session, loading: false, renderAt: Date.now() };

  const manager: Record<string, any> = {
    activeSession: session,
    session,
    isSubInterview: false,
    isLastStep: false,
    isComplete: false,
    canProgress: true,
    options: opts.managerOptions ?? {},
    parsedGraph: undefined,
    clientGraph: undefined,
    subscribe: (cb: () => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot: () => snapshot,
    isDebugEnabled: () => false,
    isAdvancedDebugEnabled: () => false,
    setDebugEnabled: mock(() => {}),
    setAdvancedDebugEnabled: mock(() => {}),
    next: mock(() => {}),
    back: mock(() => {}),
    downloadFile: mock(async () => ({ data: "" })),
    uploadFile: mock(async () => {}),
    removeFile: mock(async () => {}),
    onFileTooBig: mock(() => {}),
    getConnectedData: mock(async () => []),
    templateText: (text: string) => text,
    createSubInterview: mock(async () => {}),
    ...opts.overrides,
  };

  return manager as unknown as SessionManager;
};
