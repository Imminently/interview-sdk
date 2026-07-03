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
import { BaseSessionBackend, type BaseSessionBackendOptions } from "./backend";

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

type LocalSessionBackendSharedOptions = Omit<Partial<BaseSessionBackendOptions>, "host"> & {
  sessionId?: string;
  interactionId?: string;
  storage?: LocalSessionBackendStorage;
};

export type LocalSessionBackendOptions =
  | (LocalSessionBackendSharedOptions & {
      host: string;
      rulesEngine?: RulesEngine;
      rulesEngineScript?: string | (() => string | Promise<string>);
    })
  | (LocalSessionBackendSharedOptions & {
      host?: string;
      rulesEngine: RulesEngine;
      rulesEngineScript?: string | (() => string | Promise<string>);
    })
  | (LocalSessionBackendSharedOptions & {
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

export type LocalSessionBackendStoredState = {
  releaseData?: ReleaseData;
  session?: LocalEngineSession;
  interaction?: LocalInteraction;
  sessionMeta?: LocalSessionMetadata;
  completedSessionSynced?: boolean;
};

export interface LocalSessionBackendStorage {
  load(): LocalSessionBackendStoredState | undefined;
  save(state: LocalSessionBackendStoredState): void;
}

export const createLocalSessionBackendMemoryStorage = (): LocalSessionBackendStorage => {
  let state: LocalSessionBackendStoredState = {};
  return {
    load: () => deepClone(state),
    save: (nextState) => {
      state = deepClone(nextState);
    },
  };
};

export class LocalSessionBackend extends BaseSessionBackend {
  private rulesEngine?: RulesEngine;
  private rulesEngineScript?: LocalSessionBackendOptions["rulesEngineScript"];
  private rulesEngineScriptPromise?: Promise<string>;
  private storage: LocalSessionBackendStorage;

  constructor(options: LocalSessionBackendOptions) {
    if (!options || typeof options !== "object") {
      throw new Error("LocalSessionBackend requires host, rulesEngine, or rulesEngineScript");
    }

    if ("releaseData" in (options as UnknownRecord)) {
      throw new Error(
        "LocalSessionBackend does not accept releaseData; localReleaseData must come from the backend session response",
      );
    }

    if (!options.host && !options.rulesEngine && !options.rulesEngineScript) {
      throw new Error("LocalSessionBackend requires host, rulesEngine, or rulesEngineScript");
    }

    super({
      host: options.host ?? "",
      path: options.path,
      auth: options.auth,
      overrides: options.overrides,
      apiGetters: options.apiGetters,
    });
    this.storage = options.storage ?? createLocalSessionBackendMemoryStorage();
    this.rulesEngine = options.rulesEngine;
    this.rulesEngineScript = options.rulesEngineScript;
  }

  private getLocalState() {
    return this.storage.load() ?? {};
  }

  private saveLocalState(state: LocalSessionBackendStoredState) {
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
    const remoteSession = await this.createRemoteSession({
      ...options,
      localInterview: true,
    });
    this.storeSessionSnapshot(remoteSession, options);

    return deepClone(remoteSession);
  };

  load = async (options: SessionConfig) => {
    const remoteSession = await this.loadRemoteSession(options);
    this.storeSessionSnapshot(remoteSession, options);

    return deepClone(remoteSession);
  };

  submit = async (options: SubmitOptions) => {
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

    const session = this.toSession(result as LocalInterviewResult, {
      project: options.session.model,
      release: options.session.release,
      interview: options.session.interviewId,
      goal: options.session.goal,
    }, result.validations);
    this.updateSessionMetaFromSession(session);

    return deepClone(session);
  };

  chat = async (_options: ChatOptions): Promise<ChatResponse> => {
    throw new Error("LocalSessionBackend does not support chat");
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
      throw new Error("LocalSessionBackend requires a goal or an interview with a goal");
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
      throw new Error("LocalSessionBackend requires localReleaseData from the backend session response");
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

    const interviewResult = Array.isArray(solveResult.interview) ? solveResult.interview[0] : solveResult.interview;

    if (!interviewResult) {
      throw new Error(
        `Local interview processing failed: no interview result returned (${this.describeSolveResult(solveResult)})`,
      );
    }

    this.applySolveUpdates(solveResult, interviewResult);
    let session = this.toSession(interviewResult, options.sessionConfig, solveResult.validations);
    this.updateSessionMetaFromSession(session);

    if (session.status === "complete" && !this.completedSessionSynced) {
      session = await this.syncCompletedSession(session, options);
      this.completedSessionSynced = true;
      this.updateSessionMetaFromSession(session);
    }

    return deepClone(session);
  }

  private createRemoteSession = async (options: SessionConfig) => {
    const { initialData, project, release, response, sessionId, ...rest } = options;
    const url = this.options.apiGetters?.create ? this.options.apiGetters.create(options) : buildUrl(project, release);

    const res = await this.api.post<Session>(
      url,
      {
        data: initialData ?? {},
        response,
        ...rest,
      },
      sessionId ? { params: { session: sessionId } } : undefined,
    );

    return res.data;
  };

  private loadRemoteSession = async (options: SessionConfig) => {
    const { project, sessionId, interactionId, initialData, response, clientGraphBookmark, ...rest } = options;
    const url = this.options.apiGetters?.load ? this.options.apiGetters.load(options) : buildUrl(project);

    const res = await this.api.patch<Session>(
      url,
      { data: initialData ?? {}, response, clientGraphBookmark, ...rest },
      {
        params: { session: sessionId, interaction: interactionId },
      },
    );

    return res.data;
  };

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
    const url = this.options.apiGetters?.submit
      ? this.options.apiGetters.submit(submitOptions)
      : buildUrl(session.model, session.release);

    const res = await this.api.patch<Session>(
      url,
      {
        data: this.session?.data ?? {},
        navigate: submitOptions.navigate || undefined,
        index: session.index,
        clientGraphBookmark: submitOptions.clientGraphBookmark,
        readOnly: options.readOnly,
        ...submitOptions.overrides,
      },
      {
        params: {
          session: session.sessionId,
          interaction: session.interactionId,
        },
      },
    );

    return res.data;
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

  private applySolveUpdates(solveResult: LocalSolveResult, interviewResult: LocalInterviewResult) {
    if (!this.session || !this.interaction) {
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

  private toSession(interviewResult: LocalInterviewResult, config: SessionConfig, validations: unknown): Session {
    if (!this.session || !this.interaction) {
      throw new Error("No local session has been created");
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
      validations: validations ?? this.sessionMeta?.validations,
      clientGraph: interviewResult.clientGraph ?? this.session.clientGraph,
      clientGraphBookmark: interviewResult.clientGraphBookmark ?? this.session.clientGraphBookmark,
      relationships: this.releaseData.relationships,
      preProcessedState: interviewResult.preProcessedState,
      reporting: interviewResult.reporting,
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
