import type { InterviewTimeline } from "../playwright-test-generator";
import type {
  BackOptions,
  ChatOptions,
  ChatResponse,
  ExportTimelineOptions,
  NavigateOptions,
  Session,
  SessionConfig,
  SimulateOptions,
  SubmitOptions,
} from "../types";
import { buildUrl, normalizeSessionControls } from "../util";
import { BaseInterviewBackend, type BaseInterviewBackendOptions } from "./backend";
import { assertCorrelated, createCorrelationId, withCorrelation } from "./correlation";
import { MockInterviewBackend } from "./mock-backend";

export type RemoteInterviewBackendOptions = BaseInterviewBackendOptions;
export type RemoteInterviewSubmitRequest = {
  url: string;
  body: Record<string, unknown>;
  config: {
    params: {
      session: string;
      interaction: string;
    };
  };
};

const isTestEnvironment = () => {
  const env = (globalThis as any)?.process?.env;
  return env?.NODE_ENV === "test" || env?.VITEST === "true";
};

export const buildRemoteInterviewSubmitRequest = (
  options: SubmitOptions,
  backendOptions: Pick<RemoteInterviewBackendOptions, "apiGetters"> = {},
): RemoteInterviewSubmitRequest => {
  const { session, data, navigate, overrides, clientGraphBookmark, localInterview } = options;
  const url = backendOptions.apiGetters?.submit
    ? backendOptions.apiGetters.submit(options)
    : buildUrl(session.model, session.release);

  return {
    url,
    body: {
      data,
      navigate: navigate || undefined,
      index: session.index,
      clientGraphBookmark,
      localInterview,
      readOnly: options.readOnly,
      ...overrides,
    },
    config: {
      params: {
        session: session.sessionId,
        interaction: session.interactionId,
      },
    },
  };
};

export class RemoteInterviewBackend extends BaseInterviewBackend {
  constructor(options: RemoteInterviewBackendOptions) {
    super(options);
    if (isTestEnvironment()) {
      return new MockInterviewBackend() as unknown as RemoteInterviewBackend;
    }
  }

  /**
   * Sends a session request tagged with a correlation id (header and query param), so the browser and any proxy
   * treat it as unique, and checks the id the server echoes back matches.
   */
  private send = async <T>(
    method: "post" | "patch",
    url: string,
    body: unknown,
    params?: Record<string, string | undefined>,
    correlationId: string = createCorrelationId(),
  ): Promise<T> => {
    const res = await this.api[method]<T>(url, body, withCorrelation(correlationId, { params }));
    assertCorrelated(correlationId, res);
    return res.data;
  };

  create = async (options: SessionConfig) => {
    const { initialData, project, release, response, sessionId, ...rest } = options;

    const url = this.options.apiGetters?.create ? this.options.apiGetters.create(options) : buildUrl(project, release);

    const res = await this.send<Session>(
      "post",
      url,
      {
        data: initialData ?? {},
        response,
        ...rest,
      },
      sessionId ? { session: sessionId } : undefined,
    );
    return normalizeSessionControls(res);
  };

  load = async (options: SessionConfig) => {
    const { project, sessionId, interactionId, initialData, response, clientGraphBookmark, ...rest } = options;

    const url = this.options.apiGetters?.load ? this.options.apiGetters.load(options) : buildUrl(project);

    const res = await this.send<Session>(
      "patch",
      url,
      { data: initialData ?? {}, response, clientGraphBookmark, ...rest },
      { session: sessionId, interaction: interactionId },
    );
    return normalizeSessionControls(res);
  };

  /**
   * Submit response for current step.
   *
   * @param data The data for the current step to submit
   * @param navigate The desired navigation after update, defaults to next
   * @param overrides Other params to pass through to payload
   */
  submit = async (options: SubmitOptions) => {
    const request = buildRemoteInterviewSubmitRequest(options, this.options);
    const res = await this.send<Session>("patch", request.url, request.body, request.config.params);
    return normalizeSessionControls(res);
  };

  /**
   * Send a generative chat message
   */
  chat = async (options: ChatOptions): Promise<ChatResponse> => {
    const { session, message, goal, overrides, interactionId } = options;
    const resolvedInteractionId = interactionId !== undefined ? interactionId : session.interactionId;

    const url = this.options.apiGetters?.chat ? this.options.apiGetters.chat(options) : buildUrl(session.model);

    return this.send<ChatResponse>(
      resolvedInteractionId ? "patch" : "post",
      url,
      {
        prompt: message,
        turbo: false,
        mode: "generative",
        aiOptions: { model: "gpt-4o", temperature: 0.8 },
        goal,
        ...overrides,
      },
      {
        session: session.sessionId,
        interaction: resolvedInteractionId || undefined,
      },
    );
  };

  /**
   * Navigate to a specific step.
   *
   * @param step The desired step ID
   */
  navigate = async (options: NavigateOptions) => {
    const { session, step, overrides } = options;
    const url = this.options.apiGetters?.navigate ? this.options.apiGetters.navigate(options) : buildUrl(session.model);
    const res = await this.send<Session>(
      "patch",
      url,
      { navigate: step, readOnly: options.readOnly, ...overrides },
      {
        session: session.sessionId,
        interaction: session.interactionId,
      },
    );
    return normalizeSessionControls(res);
  };

  back = async (options: BackOptions) => {
    const { session, overrides } = options;
    const url = this.options.apiGetters?.back ? this.options.apiGetters.back(options) : buildUrl(session.model);
    const res = await this.send<Session>(
      "patch",
      url,
      { navigate: "@back", readOnly: options.readOnly, ...overrides },
      {
        session: session.sessionId,
        interaction: session.interactionId,
      },
    );
    return normalizeSessionControls(res);
  };

  simulate = async (options: SimulateOptions) => {
    const { session, payload, correlationId } = options;
    const url = this.options.apiGetters?.simulate
      ? this.options.apiGetters.simulate(options)
      : buildUrl(session.model, session.release);
    // Dynamic interactions are now on a post (due to new interaction behaviour in backend)
    const res = await this.send<Session>(
      "post",
      url,
      {
        mode: "api",
        save: false,
        ...payload,
      },
      {
        session: session.sessionId,
        interaction: session.interactionId,
      },
      correlationId,
    );
    return normalizeSessionControls(res);
  };

  exportTimeline = async (options: ExportTimelineOptions) => {
    const { session } = options;
    const url = this.options.apiGetters?.exportTimeline
      ? this.options.apiGetters.exportTimeline(options)
      : buildUrl(session.model);
    return this.send<InterviewTimeline>(
      "post",
      url,
      {
        exportTimeline: true,
      },
      {
        session: session.sessionId,
        interaction: session.interactionId,
      },
    );
  };
}
