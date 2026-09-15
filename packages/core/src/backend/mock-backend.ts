import type { InterviewTimeline } from "../playwright-test-generator";
import type {
  AsyncOptions,
  BackOptions,
  ChatOptions,
  ChatResponse,
  ExportTimelineOptions,
  GetRulesEngineOptions,
  NavigateOptions,
  RulesEngine,
  Session,
  SessionConfig,
  SimulateOptions,
  SubmitOptions,
} from "../types";
import { INTERVIEW_BACKEND_BRAND, type InterviewBackend } from "./backend";

export type MockInterviewBackendHandlers = Partial<{
  create: (options: SessionConfig) => Promise<Session> | Session;
  load: (options: SessionConfig) => Promise<Session> | Session;
  submit: (options: SubmitOptions) => Promise<Session> | Session;
  chat: (options: ChatOptions) => Promise<ChatResponse> | ChatResponse;
  navigate: (options: NavigateOptions) => Promise<Session> | Session;
  back: (options: BackOptions) => Promise<Session> | Session;
  simulate: (options: SimulateOptions) => Promise<Session> | Session;
  exportTimeline: (options: ExportTimelineOptions) => Promise<InterviewTimeline> | InterviewTimeline;
  getRulesEngine: (options?: GetRulesEngineOptions) => Promise<string> | string;
  getRulesEngineRuntime: (options?: GetRulesEngineOptions) => Promise<RulesEngine> | RulesEngine;
  getConnectedData: <T = unknown>(options: AsyncOptions) => Promise<T> | T;
}>;

export interface MockInterviewBackendOptions extends MockInterviewBackendHandlers {
  session?: Session;
  rulesEngine?: RulesEngine;
}

export const createMockInterviewSession = (overrides: Partial<Session> = {}): Session => ({
  sessionId: "mock-session",
  interactionId: "mock-interaction",
  interviewId: "mock-interview",
  goal: "mock-goal",
  model: "mock-model",
  release: "mock-release",
  reportId: "",
  status: "in-progress",
  context: { entity: "global" },
  data: { "@parent": "global" } as Session["data"],
  state: [],
  steps: [],
  screen: {
    id: "mock-screen",
    title: "Mock screen",
    context: { entity: "global" },
    controls: [],
    attributes: [],
    allAttributes: [],
  },
  ...overrides,
});

export class MockInterviewBackend implements InterviewBackend {
  private static defaults: MockInterviewBackendOptions = {};
  readonly [INTERVIEW_BACKEND_BRAND] = true;
  private readonly handlers: MockInterviewBackendHandlers;
  private readonly rulesEngine?: RulesEngine;
  session: Session;

  static configure(options: MockInterviewBackendOptions = {}) {
    MockInterviewBackend.defaults = options;
  }

  static reset() {
    MockInterviewBackend.defaults = {};
  }

  constructor(options: MockInterviewBackendOptions = {}) {
    const mergedOptions = {
      ...MockInterviewBackend.defaults,
      ...options,
    };
    const { session, rulesEngine, ...handlers } = mergedOptions;
    this.session = session ?? createMockInterviewSession();
    this.rulesEngine = rulesEngine;
    this.handlers = handlers;
  }

  async create(options: SessionConfig) {
    const session = await this.handlers.create?.(options);
    this.session = session ?? this.session;
    return this.session;
  }

  async load(options: SessionConfig) {
    const session = await this.handlers.load?.(options);
    this.session = session ?? this.session;
    return this.session;
  }

  async submit(options: SubmitOptions) {
    const session = await this.handlers.submit?.(options);
    this.session = session ?? options.session;
    return this.session;
  }

  async chat(options: ChatOptions) {
    return (await this.handlers.chat?.(options)) ?? ({} as ChatResponse);
  }

  async navigate(options: NavigateOptions) {
    const session = await this.handlers.navigate?.(options);
    this.session = session ?? options.session;
    return this.session;
  }

  async back(options: BackOptions) {
    const session = await this.handlers.back?.(options);
    this.session = session ?? options.session;
    return this.session;
  }

  async simulate(options: SimulateOptions) {
    const session = await this.handlers.simulate?.(options);
    this.session = session ?? options.session;
    return this.session;
  }

  async exportTimeline(options: ExportTimelineOptions) {
    return (await this.handlers.exportTimeline?.(options)) ?? { interview: "", goal: "", questions: [] };
  }

  async getRulesEngine(options?: GetRulesEngineOptions) {
    return (await this.handlers.getRulesEngine?.(options)) ?? "";
  }

  async getRulesEngineRuntime(options?: GetRulesEngineOptions) {
    const rulesEngine = await this.handlers.getRulesEngineRuntime?.(options);
    if (rulesEngine) return rulesEngine;
    if (this.rulesEngine) return this.rulesEngine;
    throw new Error("MockInterviewBackend does not have a rules engine runtime");
  }

  async getConnectedData<T = unknown>(options: AsyncOptions) {
    return (await this.handlers.getConnectedData?.<T>(options)) ?? ({} as T);
  }
}
