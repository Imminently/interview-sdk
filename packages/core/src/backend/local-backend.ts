import merge from "lodash/merge.js";
import type { InterviewTimeline } from "../playwright-test-generator";
import type {
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
import { buildUrl, deepClone, uuid } from "../util";
import { BaseSessionBackend, type BaseSessionBackendOptions } from "./backend";

type UnknownRecord = Record<string, unknown>;
type ResponseElement = UnknownRecord & { type?: string };
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

type LocalSessionBackendSharedOptions = Omit<Partial<BaseSessionBackendOptions>, "host"> & {
  releaseData: ReleaseData;
  sessionId?: string;
  interactionId?: string;
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

type LocalInteraction = UnknownRecord & {
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

export class LocalSessionBackend extends BaseSessionBackend {
  private releaseData: ReleaseData;
  private rulesEngine?: RulesEngine;
  private rulesEngineScript?: LocalSessionBackendOptions["rulesEngineScript"];
  private rulesEngineScriptPromise?: Promise<string>;
  private session:
    | {
        id: string;
        goal?: string;
        data: UnknownRecord;
        state: UnknownRecord;
        indices?: string[];
        indicesValues?: unknown;
        scheduled?: unknown;
        lastInteractionId?: string;
      }
    | undefined;
  private interaction: LocalInteraction | undefined;
  private sessionSnapshot: Session | undefined;
  private initialSessionId?: string;
  private initialInteractionId?: string;

  constructor(options: LocalSessionBackendOptions) {
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
    this.releaseData = deepClone(options.releaseData);
    this.rulesEngine = options.rulesEngine;
    this.rulesEngineScript = options.rulesEngineScript;
    this.initialSessionId = options.sessionId;
    this.initialInteractionId = options.interactionId;
  }

  create = async (options: SessionConfig) => {
    const sessionId = options.sessionId ?? this.initialSessionId ?? uuid();
    const interaction = this.createInteraction(options);
    const initialData = merge(
      {},
      interaction.meta?.initialData,
      interaction.meta?.initial_data,
      options.initialData ?? {},
    );

    this.session = {
      id: sessionId,
      goal: options.sessionGoal ?? options.goal ?? interaction.goal,
      data: deepClone(initialData),
      state: { nodes: {} },
      indices: options.index,
    };
    this.interaction = interaction;

    return this.runInterview({
      inputPayload: initialData,
      response: options.response,
      readOnly: options.readOnly,
      sessionConfig: options,
    });
  };

  load = async (options: SessionConfig) => {
    return this.create(options);
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

    if (!this.sessionSnapshot) {
      throw new Error("No local session has been created");
    }

    this.sessionSnapshot = {
      ...this.sessionSnapshot,
      ...result,
      data: this.sessionSnapshot.data,
      screen: result.screen ?? this.sessionSnapshot.screen,
      state: result.state ?? this.sessionSnapshot.state,
      validations: result.validations ?? this.sessionSnapshot.validations,
    };

    const sessionSnapshot = this.sessionSnapshot;
    if (!sessionSnapshot) {
      throw new Error("No local session has been created");
    }

    return deepClone(sessionSnapshot);
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

  getRulesEngineRuntime = async (_options?: GetRulesEngineOptions) => {
    return this.loadRulesEngine();
  };

  private createInteraction(options: SessionConfig): LocalInteraction {
    const interview = this.findInterview(options.interview);
    const goal = options.goal ?? interview?.goal;

    if (!goal) {
      throw new Error("LocalSessionBackend requires a goal or an interview with a goal");
    }

    if (options.interview === "autogen" || options.interview === "autogen_optimised") {
      return {
        id: options.interactionId ?? this.initialInteractionId ?? uuid(),
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

    return {
      id: options.interactionId ?? this.initialInteractionId ?? uuid(),
      goal,
      meta: deepClone(interview),
      interviewId: interview.id,
      interviewName: interview.name,
      sidebars: interview.sidebars,
      serverSideDynamic: interview.serverSideDynamic,
      mode: "interview",
      status: "in-progress",
      journey: [],
      timeline: [],
    };
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

  private async runInterview(options: {
    inputPayload?: UnknownRecord;
    navigate?: string | boolean;
    response?: ResponseElement[];
    readOnly?: boolean;
    sessionConfig: SessionConfig;
    clientGraphBookmark?: string;
  }) {
    const responseElements = this.withInterviewResponseElement(options.response, {
      navigate: typeof options.navigate === "string" ? options.navigate : undefined,
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
      throw new Error("Local interview processing failed: no interview result returned");
    }

    this.applySolveUpdates(solveResult, interviewResult);
    this.sessionSnapshot = this.toSession(interviewResult, options.sessionConfig, solveResult.validations);

    return deepClone(this.sessionSnapshot);
  }

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

    const rulesEngine = await this.loadRulesEngine();
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

  private async loadRulesEngine() {
    if (this.rulesEngine) {
      return this.rulesEngine;
    }

    const script = await this.getRulesEngine();
    // biome-ignore lint/security/noGlobalEval: Local interviews execute the same trusted rules-engine script used by the existing SDK runtime.
    this.rulesEngine = globalThis.eval(script) as RulesEngine;
    return this.rulesEngine;
  }

  private getExternalData() {
    return {
      getRelease: () => ({
        ...this.releaseData,
        rule_graph: this.releaseData.rule_graph,
      }),
      getInterview: (interviewId: string) => this.findInterview(interviewId) ?? null,
      findMapping: () => null,
      findConnection: () => null,
      getSpreadsheetCell: () => null,
    };
  }

  private withInterviewResponseElement(response: ResponseElement[] | undefined, element: ResponseElement) {
    const responseElements = [...(response ?? [])].filter((item) => item?.type !== "interview");
    responseElements.push({
      type: "interview",
      navigate: element.navigate,
      readOnly: element.readOnly,
      sessionGoal: element.sessionGoal,
    });
    return responseElements;
  }

  private applySolveUpdates(solveResult: LocalSolveResult, interviewResult: LocalInterviewResult) {
    if (!this.session || !this.interaction) {
      return;
    }

    this.session = {
      ...this.session,
      ...solveResult.sessionUpdate,
      data: solveResult.sessionUpdate?.data ?? interviewResult.data ?? this.session.data,
      state: solveResult.sessionUpdate?.state ?? this.session.state,
      lastInteractionId: this.interaction.id,
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
      interviewId: this.interaction.interviewId ?? config.interview ?? "autogen",
      goal: this.interaction.goal ?? config.goal ?? "",
      model: String(config.project ?? this.releaseData.model ?? ""),
      release: String(config.release ?? this.releaseData.id ?? ""),
      reportId: "",
      status: interviewResult.status ?? this.interaction.status ?? "in-progress",
      context: interviewResult.context,
      data: interviewResult.data ?? this.session.data,
      state: interviewResult.state,
      steps: interviewResult.steps ?? [],
      screen: interviewResult.screen,
      progress: interviewResult.progress,
      explanations: interviewResult.explanations,
      locale: this.releaseData.locale,
      validations,
      clientGraph: interviewResult.clientGraph,
      clientGraphBookmark: interviewResult.clientGraphBookmark,
      relationships: this.releaseData.relationships,
      preProcessedState: interviewResult.preProcessedState,
      reporting: interviewResult.reporting,
      inferredOrder: this.releaseData.inferredOrder,
      rulesEngineChecksum: interviewResult.rulesEngineChecksum,
      __deprecatedSessionData: interviewResult.__deprecatedSessionData,
    } as unknown as Session;
  }
}
