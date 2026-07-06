import merge from "lodash/merge.js";
import { decompressGraph } from "../graphUtil";
import type { InterviewTimeline } from "../playwright-test-generator";
import type {
  BackOptions,
  ChatOptions,
  ChatResponse,
  ExportTimelineOptions,
  GetRulesEngineOptions,
  Navigate,
  NavigateOptions,
  NavigateTargetOptions,
  AttributeValues,
  RulesEngine,
  Session,
  SessionConfig,
  SimulateOptions,
  SubmitOptions,
} from "../types";
import { buildUrl, deepClone, uuid } from "../util";
import { BaseInterviewBackend, type BaseInterviewBackendOptions } from "./backend";
import { RemoteBackend } from "./remote-backend";

type UnknownRecord = Record<string, unknown>;
type ResponseElement = UnknownRecord & { type?: string };
type InterviewResponseElement = ResponseElement & {
  navigate?: NavigateTargetOptions;
  readOnly?: boolean;
  sessionGoal?: string;
};
type LocalSolveResult = UnknownRecord & {
  interview?: LocalInterviewResult | LocalInterviewResult[];
  sessionUpdate?: UnknownRecord & {
    data?: UnknownRecord;
    state?: UnknownRecord;
  };
  interactionUpdate?: UnknownRecord;
  reporting?: unknown;
  validations?: unknown;
};
type LocalInterviewResult = UnknownRecord & {
  interviewId?: string;
  data?: UnknownRecord;
  state?: UnknownRecord;
  context?: unknown;
  steps?: unknown[];
  screen?: Session["screen"];
  progress?: unknown;
  explanations?: unknown;
  validations?: unknown;
  clientGraph?: string;
  clientGraphBookmark?: string;
  preProcessedState?: unknown;
  reporting?: unknown;
  rulesEngineChecksum?: string;
  __deprecatedSessionData?: unknown;
  status?: LocalInteraction["status"];
  journey?: unknown[];
  timeline?: unknown[];
  current_step?: string;
  currentStep?: string;
  current_step_meta?: string;
  currentStepMeta?: string;
};

type LocalInterviewBackendSharedOptions = Omit<Partial<BaseInterviewBackendOptions>, "host"> & {
  sessionId?: string;
  interactionId?: string;
  storage: LocalInterviewBackendStorage;
};

export type LocalInterviewBackendOptions =
  | (LocalInterviewBackendSharedOptions & {
      host: string;
      rulesEngine?: RulesEngine;
      rulesEngineScript?: string | (() => string | Promise<string>);
    })
  | (LocalInterviewBackendSharedOptions & {
      host?: string;
      rulesEngine: RulesEngine;
      rulesEngineScript?: string | (() => string | Promise<string>);
    })
  | (LocalInterviewBackendSharedOptions & {
      host?: string;
      rulesEngine?: RulesEngine;
      rulesEngineScript: string | (() => string | Promise<string>);
    });

export type LocalInteraction = UnknownRecord & {
  id: string;
  mode: "interview";
  status: "in-progress" | "complete" | "error";
  goal?: string;
  interviewId?: string;
  interviewName?: string;
  meta?: ReleaseInterview;
  steps?: unknown[];
  journey?: unknown[];
  timeline?: unknown[];
  current_step?: string;
  current_step_meta?: string;
};

type ReleaseInterview = UnknownRecord & {
  id?: string;
  name?: string;
  default?: boolean;
  goal?: string;
  initialData?: UnknownRecord;
  initial_data?: UnknownRecord;
  sidebars?: unknown;
  serverSideDynamic?: unknown;
};

type ReleaseData = UnknownRecord & {
  id?: string;
  model?: string;
  locale?: string;
  interviews?: ReleaseInterview[];
  rule_graph?: unknown;
  relationships?: unknown[];
  inferredOrder?: string[];
  enums?: unknown[];
};

export type LocalEngineSession = {
  id: string;
  goal?: string;
  data: UnknownRecord;
  state: UnknownRecord;
  indices?: string[];
  indicesValues?: unknown;
  scheduled?: unknown;
  lastInteractionId?: string;
  clientGraph?: Session["clientGraph"];
  clientGraphBookmark?: Session["clientGraphBookmark"];
};

export type LocalSessionMetadata = {
  model?: string;
  release?: string;
  reportId?: string;
  locale?: string;
  rulesEngineChecksum?: string;
  screenData?: UnknownRecord;
  screenState?: unknown;
  validations?: unknown;
};

export type LocalInterviewBackendStoredState = {
  releaseData?: ReleaseData;
  session?: LocalEngineSession;
  interaction?: LocalInteraction;
  sessionMeta?: LocalSessionMetadata;
  completedSessionSynced?: boolean;
};

export interface LocalInterviewBackendStorage {
  load(): LocalInterviewBackendStoredState | undefined;
  save(state: LocalInterviewBackendStoredState): void;
}

export const createLocalInterviewBackendMemoryStorage = (): LocalInterviewBackendStorage => {
  let state: LocalInterviewBackendStoredState = {};
  return {
    load: () => deepClone(state),
    save: (nextState) => {
      state = deepClone(nextState);
    },
  };
};

export class LocalInterviewBackend extends BaseInterviewBackend {
  private remoteBackend: RemoteBackend;
  private rulesEngine?: RulesEngine;
  private rulesEngineScript?: LocalInterviewBackendOptions["rulesEngineScript"];
  private rulesEngineScriptPromise?: Promise<string>;
  private storage: LocalInterviewBackendStorage;

  constructor(options: LocalInterviewBackendOptions) {
    if (!options || typeof options !== "object") {
      throw new Error("LocalInterviewBackend requires host, rulesEngine, or rulesEngineScript");
    }

    if ("releaseData" in (options as UnknownRecord)) {
      throw new Error(
        "LocalInterviewBackend does not accept releaseData; localReleaseData must come from the backend session response",
      );
    }

    if (!options.host && !options.rulesEngine && !options.rulesEngineScript) {
      throw new Error("LocalInterviewBackend requires host, rulesEngine, or rulesEngineScript");
    }

    if (!options.storage) {
      throw new Error("LocalInterviewBackend requires storage");
    }

    const backendOptions = {
      host: options.host ?? "",
      path: options.path,
      auth: options.auth,
      overrides: options.overrides,
      apiGetters: options.apiGetters,
    };

    super(backendOptions);
    this.remoteBackend = new RemoteBackend(backendOptions);
    this.storage = options.storage;
    this.rulesEngine = options.rulesEngine;
    this.rulesEngineScript = options.rulesEngineScript;
  }

  private getLocalState() {
    return this.storage.load() ?? {};
  }

  private saveLocalState(state: LocalInterviewBackendStoredState) {
    this.storage.save(state);
  }

  private get session() {
    return this.getLocalState().session;
  }

  private set session(session: LocalEngineSession | undefined) {
    this.saveLocalState({
      ...this.getLocalState(),
      session,
    });
  }

  private get interaction() {
    return this.getLocalState().interaction;
  }

  private set interaction(interaction: LocalInteraction | undefined) {
    this.saveLocalState({
      ...this.getLocalState(),
      interaction,
    });
  }

  private get releaseData() {
    return this.getLocalState().releaseData ?? {};
  }

  private set releaseData(releaseData: ReleaseData) {
    this.saveLocalState({
      ...this.getLocalState(),
      releaseData,
    });
  }

  private get sessionMeta() {
    return this.getLocalState().sessionMeta;
  }

  private set sessionMeta(sessionMeta: LocalSessionMetadata | undefined) {
    this.saveLocalState({
      ...this.getLocalState(),
      sessionMeta,
    });
  }

  private get completedSessionSynced() {
    return Boolean(this.getLocalState().completedSessionSynced);
  }

  private set completedSessionSynced(completedSessionSynced: boolean) {
    this.saveLocalState({
      ...this.getLocalState(),
      completedSessionSynced,
    });
  }

  create = async (options: SessionConfig) => {
    const remoteSession = await this.remoteBackend.create({
      ...options,
      localInterview: true,
    });
    this.storeSessionSnapshot(remoteSession, options);

    return deepClone(remoteSession);
  };

  load = async (options: SessionConfig) => {
    const remoteSession = await this.remoteBackend.load(options);
    this.storeSessionSnapshot(remoteSession, options);

    return deepClone(remoteSession);
  };

  submit = async (options: SubmitOptions) => {
    if (options.remote) {
      return this.remoteSubmit(options);
    }

    return this.runInterview({
      inputPayload: options.data,
      navigate: options.navigate,
      response: options.overrides?.response,
      readOnly: options.readOnly,
      sessionConfig: {
        project: options.session.model,
        release: options.session.release,
        interview: options.session.interviewId,
        goal: options.session.goal,
      },
      clientGraphBookmark: options.clientGraphBookmark,
    });
  };

  navigate = async (options: NavigateOptions) => {
    return this.runInterview({
      navigate: options.step,
      response: options.overrides?.response,
      readOnly: options.readOnly,
      sessionConfig: {
        project: options.session.model,
        release: options.session.release,
        interview: options.session.interviewId,
        goal: options.session.goal,
      },
    });
  };

  back = async (options: BackOptions) => {
    return this.runInterview({
      navigate: "@back",
      response: options.overrides?.response,
      readOnly: options.readOnly,
      sessionConfig: {
        project: options.session.model,
        release: options.session.release,
        interview: options.session.interviewId,
        goal: options.session.goal,
      },
    });
  };

  simulate = async (options: SimulateOptions): Promise<Session> => {
    const result = await this.runSolve({
      inputPayload: options.payload.data ?? {},
      responseElements: Array.isArray(options.payload.response) ? options.payload.response : [],
      goal: String(options.payload.goal ?? options.session.goal),
      sessionConfig: {
        project: options.session.model,
        release: options.session.release,
        interview: options.session.interviewId,
        goal: options.session.goal,
      },
    });

    if (!this.session || !this.interaction) {
      throw new Error("No local session has been created");
    }

    const solveResult: LocalSolveResult = result.interview
      ? result
      : {
          ...result,
          interview: result as LocalInterviewResult,
        };
    const session = this.toSession(solveResult, {
      project: options.session.model,
      release: options.session.release,
      interview: options.session.interviewId,
      goal: options.session.goal,
    });
    this.updateSessionMetaFromSession(session);

    return deepClone(session);
  };

  chat = async (_options: ChatOptions): Promise<ChatResponse> => {
    throw new Error("LocalInterviewBackend does not support chat");
  };

  exportTimeline = async (_options: ExportTimelineOptions): Promise<InterviewTimeline> => {
    return {
      interview: this.interaction?.interviewId ?? "",
      goal: this.interaction?.goal ?? "",
      questions: deepClone(this.interaction?.timeline ?? []) as InterviewTimeline["questions"],
    };
  };

  getRulesEngine = async (_options?: GetRulesEngineOptions) => {
    if (this.rulesEngineScriptPromise) {
      return this.rulesEngineScriptPromise;
    }

    if (typeof this.rulesEngineScript === "function") {
      this.rulesEngineScriptPromise = Promise.resolve(this.rulesEngineScript());
      return this.rulesEngineScriptPromise;
    }

    if (typeof this.rulesEngineScript === "string") {
      return this.rulesEngineScript;
    }

    const checksum = _options?.checksum;
    const url = this.options.apiGetters?.getRulesEngine
      ? this.options.apiGetters.getRulesEngine(_options)
      : buildUrl(this.options.host, `decisionapi/rules-engine-script?checksum=${checksum}`);

    this.rulesEngineScriptPromise = this.api
      .get(url, {
        adapter: "fetch",
        fetchOptions: { cache: "force-cache" },
      })
      .then((res) => {
        return res.data as string;
      });

    return this.rulesEngineScriptPromise;
  };

  getRulesEngineRuntime = async (options?: GetRulesEngineOptions) => {
    return this.loadRulesEngine(options);
  };

  getStoredState = () => {
    return this.getLocalState();
  };

  storeSessionSnapshot = (session: Session, config: SessionConfig = {}) => {
    this.updateLocalReleaseData(session.localReleaseData);
    const interaction = this.createInteraction({
      ...config,
      project: config.project ?? session.model,
      release: config.release ?? session.release,
      interview: session.interviewId ?? config.interview,
      goal: session.goal ?? config.goal,
      interactionId: session.interactionId ?? config.interactionId,
    });

    this.session = {
      id: session.sessionId,
      goal: session.goal ?? config.sessionGoal ?? config.goal ?? interaction.goal,
      data: deepClone((session.__deprecatedSessionData as UnknownRecord | undefined) ?? {}),
      state: this.toLocalEngineState(session.state),
      indices: config.index,
      clientGraph: session.clientGraph,
      clientGraphBookmark: session.clientGraphBookmark,
    };
    this.interaction = {
      ...interaction,
      id: session.interactionId ?? config.interactionId ?? uuid(),
      status: session.status,
      steps: session.steps,
      current_step: this.findCurrentStepId(session.steps),
      current_step_meta: (session as unknown as UnknownRecord).current_step_meta as string | undefined,
    };
    this.completedSessionSynced = session.status === "complete";
    this.sessionMeta = {
      model: session.model,
      release: session.release,
      reportId: session.reportId,
      locale: session.locale,
      rulesEngineChecksum: session.rulesEngineChecksum,
      screenData: session.data as unknown as UnknownRecord,
      screenState: session.state,
      validations: session.validations,
    };
  };

  private createInteraction(options: SessionConfig): LocalInteraction {
    const interview = this.findInterview(options.interview);
    const goal = options.goal ?? interview?.goal;

    if (!goal) {
      throw new Error("LocalInterviewBackend requires a goal or an interview with a goal");
    }

    if (options.interview === "autogen" || options.interview === "autogen_optimised") {
      return {
        id: options.interactionId ?? uuid(),
        goal,
        meta: { steps: [] },
        interviewId: "autogen",
        interviewName: "Autogen",
        steps: [],
        mode: "interview",
        status: "in-progress",
        journey: [],
        timeline: [],
      };
    }

    if (!interview) {
      throw new Error(`Interview not found: ${options.interview ?? "default"}`);
    }

    const meta = {
      ...deepClone(interview),
      serverSideDynamic: false,
    };

    return {
      id: options.interactionId ?? uuid(),
      goal,
      meta,
      interviewId: interview.id,
      interviewName: interview.name,
      sidebars: interview.sidebars,
      serverSideDynamic: false,
      mode: "interview",
      status: "in-progress",
      journey: [],
      timeline: [],
    };
  }

  private updateLocalReleaseData(localReleaseData: Session["localReleaseData"]) {
    if (!localReleaseData) {
      throw new Error("LocalInterviewBackend requires localReleaseData from the backend session response");
    }

    this.releaseData = deepClone(localReleaseData) as ReleaseData;
  }

  private findInterview(interviewIdOrName: string | undefined) {
    if (!Array.isArray(this.releaseData.interviews)) {
      return undefined;
    }

    if (!interviewIdOrName || interviewIdOrName === "default") {
      return this.releaseData.interviews.find((interview) => interview.default);
    }

    return this.releaseData.interviews.find((interview) => {
      return interview.id === interviewIdOrName || interview.name === interviewIdOrName;
    });
  }

  private toLocalEngineState(state: unknown): UnknownRecord {
    if (state && typeof state === "object" && !Array.isArray(state) && "nodes" in state) {
      return state as UnknownRecord;
    }

    return { nodes: {} };
  }

  private findCurrentStepId(steps: Session["steps"] | undefined): string | undefined {
    for (const step of steps ?? []) {
      if (step.current) {
        return step.id;
      }
      const childStep = this.findCurrentStepId(step.steps);
      if (childStep) {
        return childStep;
      }
    }
    return undefined;
  }

  private describeSolveResult(solveResult: unknown) {
    if (!solveResult || typeof solveResult !== "object") {
      return `result type: ${typeof solveResult}`;
    }

    const result = solveResult as UnknownRecord;
    const error = result.error;
    if (error) {
      return `keys: ${Object.keys(result).join(", ") || "none"}; error: ${JSON.stringify(error)}`;
    }

    return `keys: ${Object.keys(result).join(", ") || "none"}`;
  }

  private async runInterview(options: {
    inputPayload?: UnknownRecord;
    navigate?: Navigate;
    response?: ResponseElement[];
    readOnly?: boolean;
    sessionConfig: SessionConfig;
    clientGraphBookmark?: string;
  }) {
    const navigate = this.normalizeNavigate(options.navigate);
    const responseElements = this.withInterviewResponseElement(options.response, {
      navigate,
      readOnly: options.readOnly,
      sessionGoal: this.session?.goal,
    });

    const solveResult = await this.runSolve({
      inputPayload: options.inputPayload,
      responseElements,
      goal: this.interaction?.goal,
      sessionConfig: options.sessionConfig,
      clientGraphBookmark: options.clientGraphBookmark,
    });

    const interviewResult = this.getInterviewResult(solveResult);

    if (!interviewResult) {
      throw new Error(
        `Local interview processing failed: no interview result returned (${this.describeSolveResult(solveResult)})`,
      );
    }

    this.applySolveUpdates(solveResult);
    let session = this.toSession(solveResult, options.sessionConfig);
    this.updateSessionMetaFromSession(session);

    if (session.status === "complete" && !this.completedSessionSynced) {
      session = await this.syncCompletedSession(session, options);
      this.completedSessionSynced = true;
      this.updateSessionMetaFromSession(session);
    }

    return deepClone(session);
  }

  private syncCompletedSession = async (
    session: Session,
    options: {
      navigate?: Navigate;
      response?: ResponseElement[];
      readOnly?: boolean;
      clientGraphBookmark?: string;
    },
  ) => {
    const submitOptions: SubmitOptions = {
      session,
      data: this.session?.data as unknown as AttributeValues,
      navigate: this.normalizeNavigate(options.navigate),
      overrides: options.response ? { response: options.response } : undefined,
      clientGraphBookmark: options.clientGraphBookmark ?? session.clientGraphBookmark,
      readOnly: options.readOnly,
    };
    return this.remoteBackend.submit(submitOptions);
  };

  private remoteSubmit = async (options: SubmitOptions) => {
    const remoteSession = await this.remoteBackend.submit(options);
    this.updateSessionMetaFromSession(remoteSession);
    return remoteSession;
  };

  private async runSolve(options: {
    inputPayload?: UnknownRecord;
    responseElements: ResponseElement[];
    goal?: string;
    sessionConfig: SessionConfig;
    clientGraphBookmark?: string;
  }) {
    if (!this.session || !this.interaction) {
      throw new Error("No local session has been created");
    }

    const rulesEngine = await this.loadRulesEngine({
      checksum: this.sessionMeta?.rulesEngineChecksum,
    });
    const goal = options.goal ?? this.interaction.goal;

    return rulesEngine.solve(
      {
        input: options.inputPayload ?? {},
        inputPayload: options.inputPayload,
        roots: undefined,
        goal,
        mode: "session",
        session: {
          id: this.session.id,
          goal: this.session.goal,
          data: this.session.data,
          state: this.session.state,
          indices: this.session.indices,
          indicesValues: this.session.indicesValues,
          scheduled: this.session.scheduled,
          lastInteractionId: this.session.lastInteractionId,
        },
        interaction: {
          ...this.interaction,
          type: this.interaction.mode,
        },
        response_elements: options.responseElements,
        responseElements: options.responseElements,
        release_id: String(options.sessionConfig.release ?? this.releaseData.id ?? ""),
        model_id: String(options.sessionConfig.project ?? this.releaseData.model ?? ""),
        release_enums: this.releaseData.enums,
        state: this.session.state,
        clientGraphBookmark: options.clientGraphBookmark,
      },
      String(options.sessionConfig.release ?? this.releaseData.id ?? "local-release"),
      this.getExternalData(),
      {},
    );
  }

  private async loadRulesEngine(options?: GetRulesEngineOptions) {
    if (this.rulesEngine) {
      return this.rulesEngine;
    }

    const script = await this.getRulesEngine(options);
    // biome-ignore lint/security/noGlobalEval: Local interviews execute the same trusted rules-engine script used by the existing SDK runtime.
    this.rulesEngine = globalThis.eval(script) as RulesEngine;
    return this.rulesEngine;
  }

  private getExternalData() {
    return {
      getRelease: () => ({
        ...this.releaseData,
        rule_graph: this.getRuleGraphForLocalSolve(),
      }),
      getInterview: (interviewId: string) => this.findInterview(interviewId) ?? null,
      findMapping: () => null,
      findConnection: () => null,
      getSpreadsheetCell: () => null,
    };
  }

  private getRuleGraphForLocalSolve() {
    const clientGraph = this.session?.clientGraph;
    if (!clientGraph) {
      return this.releaseData.rule_graph;
    }

    try {
      return decompressGraph(clientGraph);
    } catch {
      return clientGraph;
    }
  }

  private withInterviewResponseElement(response: ResponseElement[] | undefined, element: InterviewResponseElement) {
    const responseElements = [...(response ?? [])].filter((item) => item?.type !== "interview");
    responseElements.push({
      type: "interview",
      navigate: element.navigate,
      readOnly: element.readOnly,
      sessionGoal: element.sessionGoal,
    });
    return responseElements;
  }

  private normalizeNavigate(navigate: Navigate | undefined): NavigateTargetOptions | undefined {
    if (typeof navigate === "string") {
      return { stepId: navigate };
    }

    if (navigate && typeof navigate === "object") {
      return navigate;
    }

    if (navigate !== true) {
      return undefined;
    }

    return undefined;
  }

  private getInterviewResult(solveResult: LocalSolveResult): LocalInterviewResult | undefined {
    if (Array.isArray(solveResult.interview)) {
      return solveResult.interview[0];
    }

    return solveResult.interview;
  }

  private applySolveUpdates(solveResult: LocalSolveResult) {
    if (!this.session || !this.interaction) {
      return;
    }

    const interviewResult = this.getInterviewResult(solveResult);
    if (!interviewResult) {
      return;
    }

    this.session = {
      ...this.session,
      ...solveResult.sessionUpdate,
      data: solveResult.sessionUpdate?.data ?? this.session.data,
      state: solveResult.sessionUpdate?.state ?? this.session.state,
      lastInteractionId: this.interaction.id,
      clientGraph: interviewResult.clientGraph ?? this.session.clientGraph,
      clientGraphBookmark: interviewResult.clientGraphBookmark ?? this.session.clientGraphBookmark,
    };

    this.interaction = {
      ...this.interaction,
      ...solveResult.interactionUpdate,
      steps: interviewResult.steps,
      progress: interviewResult.progress,
      status: interviewResult.status ?? this.interaction.status,
      journey: interviewResult.journey,
      timeline: interviewResult.timeline,
      current_step: interviewResult.current_step ?? interviewResult.currentStep,
      current_step_meta: interviewResult.current_step_meta ?? interviewResult.currentStepMeta,
    };
  }

  private toSession(
    solveResult: LocalSolveResult,
    config: SessionConfig,
  ): Session {
    if (!this.session || !this.interaction) {
      throw new Error("No local session has been created");
    }

    const interviewResult = this.getInterviewResult(solveResult);
    if (!interviewResult) {
      throw new Error(
        `Local interview processing failed: no interview result returned (${this.describeSolveResult(solveResult)})`,
      );
    }

    return {
      sessionId: this.session.id,
      interactionId: this.interaction.id,
      interviewId: interviewResult.interviewId ?? this.interaction.interviewId ?? config.interview ?? "autogen",
      goal: this.interaction.goal ?? config.goal ?? "",
      model: String(config.project ?? this.sessionMeta?.model ?? this.releaseData.model ?? ""),
      release: String(config.release ?? this.sessionMeta?.release ?? this.releaseData.id ?? ""),
      reportId: this.sessionMeta?.reportId ?? "",
      status: interviewResult.status ?? this.interaction.status ?? "in-progress",
      context: interviewResult.context,
      data: interviewResult.data ?? this.sessionMeta?.screenData ?? {},
      state: interviewResult.state ?? this.sessionMeta?.screenState,
      steps: interviewResult.steps ?? [],
      screen: interviewResult.screen,
      progress: interviewResult.progress,
      explanations: interviewResult.explanations,
      locale: this.sessionMeta?.locale ?? this.releaseData.locale,
      validations: solveResult.validations ?? this.sessionMeta?.validations,
      clientGraph: interviewResult.clientGraph ?? this.session.clientGraph,
      clientGraphBookmark: interviewResult.clientGraphBookmark ?? this.session.clientGraphBookmark,
      relationships: this.releaseData.relationships,
      preProcessedState: interviewResult.preProcessedState,
      reporting: solveResult.reporting,
      inferredOrder: this.releaseData.inferredOrder,
      rulesEngineChecksum: interviewResult.rulesEngineChecksum ?? this.sessionMeta?.rulesEngineChecksum,
      __deprecatedSessionData: interviewResult.__deprecatedSessionData,
      current_step: this.interaction.current_step,
      current_step_meta: this.interaction.current_step_meta,
    } as unknown as Session;
  }

  private updateSessionMetaFromSession(session: Session) {
    this.sessionMeta = {
      model: session.model,
      release: session.release,
      reportId: session.reportId,
      locale: session.locale,
      rulesEngineChecksum: session.rulesEngineChecksum,
      screenData: session.data as unknown as UnknownRecord,
      screenState: session.state,
      validations: session.validations,
    };
  }
}
