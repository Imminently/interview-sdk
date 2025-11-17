import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
  AsyncOptions,
  AuthConfigGetter,
  BackOptions,
  ChatOptions,
  ChatResponse,
  ExportTimelineOptions,
  GetRulesEngineOptions,
  NavigateOptions,
  Session,
  SessionConfig,
  SimulateOptions,
  SubmitOptions
} from "./types";
import { buildUrl, createApiInstance } from "./util";

const defaultPath = ["decisionapi", "session"];

export interface ApiManagerOptions {
  host: string;
  path?: string | string[];
  auth?: AuthConfigGetter;
  overrides?: AxiosRequestConfig;
  /** API getters for each function */
  apiGetters?: {
    create?: (options: SessionConfig) => string;
    load?: (options: SessionConfig) => string;
    submit?: (options: SubmitOptions) => string;
    chat?: (options: ChatOptions) => string;
    navigate?: (options: NavigateOptions) => string;
    back?: (options: BackOptions) => string;
    simulate?: (options: SimulateOptions) => string;
    exportTimeline?: (options: ExportTimelineOptions) => string;
    getRulesEngine?: (options?: GetRulesEngineOptions) => string;
    getConnectedData?: (options: AsyncOptions) => string;
  };
}

export class ApiManager {
  protected api: AxiosInstance;
  protected options: ApiManagerOptions;

  constructor(options: ApiManagerOptions) {
    // create the api instance
    const { host, auth, overrides = {}, path = defaultPath } = options;
    const baseUrl = buildUrl(host, ...(typeof path === "string" ? [path] : path));
    this.api = createApiInstance(baseUrl, auth, overrides);
    this.options = options;
  }

  create = async (options: SessionConfig) => {
    const { initialData, project, release, responseElements, sessionId, ...rest } = options;

    const url = this.options.apiGetters?.create ? this.options.apiGetters.create(options) : buildUrl(project, release);

    const res = await this.api.post<Session>(
      url,
      {
        data: initialData ?? {},
        response: responseElements,
        ...rest,
      },
      sessionId ? { params: { session: sessionId } } : undefined,
    );
    return res.data;
  };

  load = async (options: SessionConfig) => {
    const { project, sessionId, interactionId, initialData, clientGraphBookmark } = options;

    const url = this.options.apiGetters?.load ? this.options.apiGetters.load(options) : buildUrl(project);

    const res = await this.api.patch<Session>(
      url,
      { data: initialData ?? {}, clientGraphBookmark },
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
    const { session, data, navigate, overrides, clientGraphBookmark } = options;
    const url = this.options.apiGetters?.submit
      ? this.options.apiGetters.submit(options)
      : buildUrl(session.model, session.release);
    const res = await this.api.patch<Session>(
      url,
      {
        data,
        navigate: navigate || undefined,
        index: session.index,
        clientGraphBookmark,
        readOnly: options.readOnly,
        ...overrides,
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
    const res = await this.api.post<string>(
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

  // for easy overriding, make this a separate method
  protected getRulesEngineUrl = (checksum?: string) => {
    return buildUrl(this.options.host, `decisionapi/rules-engine-script?checksum=${checksum}`);
  };

  /**
   * Fetch the rules engine.
   * If you want to override the URL, you can do so by overriding the `getRulesEngineUrl` method.
   * @param checksum Optional checksum to fetch a specific version of the rules engine script
   * @returns The rules engine script as a string
   */
  getRulesEngine = async (options?: GetRulesEngineOptions) => {
    const checksum = options?.checksum;
    const url = this.options.apiGetters?.getRulesEngine
      ? this.options.apiGetters.getRulesEngine(options)
      : this.getRulesEngineUrl(checksum);

    const res = await this.api.get(url, {
      adapter: "fetch",
      fetchOptions: { cache: "force-cache" },
    });
    return res.data as string;
  };

  getConnectedData = async <T = any>(options: AsyncOptions) => {
    const url = this.options.apiGetters?.getConnectedData
      ? this.options.apiGetters.getConnectedData(options)
      : buildUrl(this.options.host, "decisionapi/connection");

    const res = await this.api.post<T>(url, options);
    return res.data as T;
  }
}
