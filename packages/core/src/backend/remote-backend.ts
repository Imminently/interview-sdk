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
import { buildUrl } from "../util";
import { BaseInterviewBackend, type BaseInterviewBackendOptions } from "./backend";
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
  const { session, data, navigate, overrides, clientGraphBookmark } = options;
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

export class RemoteBackend extends BaseInterviewBackend {
  constructor(options: RemoteInterviewBackendOptions) {
    super(options);
    if (isTestEnvironment()) {
      return new MockInterviewBackend() as unknown as RemoteBackend;
    }
  }

  create = async (options: SessionConfig) => {
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

  load = async (options: SessionConfig) => {
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

  /**
   * Submit response for current step.
   *
   * @param data The data for the current step to submit
   * @param navigate The desired navigation after update, defaults to next
   * @param overrides Other params to pass through to payload
   */
  submit = async (options: SubmitOptions) => {
    const request = buildRemoteInterviewSubmitRequest(options, this.options);
    const res = await this.api.patch<Session>(request.url, request.body, request.config);
    return res.data;
  };

  /**
   * Send a generative chat message
   */
  chat = async (options: ChatOptions): Promise<ChatResponse> => {
    const { session, message, goal, overrides, interactionId } = options;
    const resolvedInteractionId = interactionId !== undefined ? interactionId : session.interactionId;

    const url = this.options.apiGetters?.chat ? this.options.apiGetters.chat(options) : buildUrl(session.model);

    const res = await this.api[resolvedInteractionId ? "patch" : "post"]<ChatResponse>(
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
        params: {
          session: session.sessionId,
          interaction: resolvedInteractionId || undefined,
        },
      },
    );
    return res.data;
  };

  /**
   * Navigate to a specific step.
   *
   * @param step The desired step ID
   */
  navigate = async (options: NavigateOptions) => {
    const { session, step, overrides } = options;
    const url = this.options.apiGetters?.navigate ? this.options.apiGetters.navigate(options) : buildUrl(session.model);
    const res = await this.api.patch<Session>(
      url,
      { navigate: step, readOnly: options.readOnly, ...overrides },
      {
        params: {
          session: session.sessionId,
          interaction: session.interactionId,
        },
      },
    );
    return res.data;
  };

  back = async (options: BackOptions) => {
    const { session, overrides } = options;
    const url = this.options.apiGetters?.back ? this.options.apiGetters.back(options) : buildUrl(session.model);
    const res = await this.api.patch<Session>(
      url,
      { navigate: "@back", readOnly: options.readOnly, ...overrides },
      {
        params: {
          session: session.sessionId,
          interaction: session.interactionId,
        },
      },
    );
    return res.data;
  };

  simulate = async (options: SimulateOptions) => {
    const { session, payload } = options;
    const url = this.options.apiGetters?.simulate
      ? this.options.apiGetters.simulate(options)
      : buildUrl(session.model, session.release);
    // Dynamic interactions are now on a post (due to new interaction behaviour in backend)
    const res = await this.api.post<Session>(
      url,
      {
        mode: "api",
        save: false,
        ...payload,
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

  exportTimeline = async (options: ExportTimelineOptions) => {
    const { session } = options;
    const url = this.options.apiGetters?.exportTimeline
      ? this.options.apiGetters.exportTimeline(options)
      : buildUrl(session.model);
    const res = await this.api.post<InterviewTimeline>(
      url,
      {
        exportTimeline: true,
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
}
