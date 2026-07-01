import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { InterviewTimeline } from "../playwright-test-generator";
import type {
  AsyncOptions,
  AuthConfigGetter,
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
import { buildUrl, createApiInstance } from "../util";

export const SESSION_BACKEND_BRAND = "deci.api_manager" as const;

const defaultPath = ["decisionapi", "session"];

export interface SessionBackendApiGetters {
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
}

export interface BaseSessionBackendOptions {
  host: string;
  path?: string | string[];
  auth?: AuthConfigGetter;
  overrides?: AxiosRequestConfig;
  /** API getters for each function */
  apiGetters?: SessionBackendApiGetters;
}

export interface SessionBackend {
  readonly [SESSION_BACKEND_BRAND]: true;
  create(options: SessionConfig): Promise<Session>;
  load(options: SessionConfig): Promise<Session>;
  submit(options: SubmitOptions): Promise<Session>;
  chat(options: ChatOptions): Promise<ChatResponse>;
  navigate(options: NavigateOptions): Promise<Session>;
  back(options: BackOptions): Promise<Session>;
  simulate(options: SimulateOptions): Promise<Session>;
  exportTimeline(options: ExportTimelineOptions): Promise<InterviewTimeline>;
  getRulesEngine(options?: GetRulesEngineOptions): Promise<string>;
  getRulesEngineRuntime?(options?: GetRulesEngineOptions): Promise<RulesEngine>;
  getConnectedData<T = unknown>(options: AsyncOptions): Promise<T>;
}

export abstract class BaseSessionBackend implements SessionBackend {
  readonly [SESSION_BACKEND_BRAND] = true;
  protected api: AxiosInstance;
  protected options: BaseSessionBackendOptions;

  constructor(options: BaseSessionBackendOptions) {
    const { host, auth, overrides = {}, path = defaultPath } = options;
    const baseUrl = buildUrl(host, ...(typeof path === "string" ? [path] : path));
    this.api = createApiInstance(baseUrl, auth, overrides);
    this.options = options;
  }

  abstract create: (options: SessionConfig) => Promise<Session>;
  abstract load: (options: SessionConfig) => Promise<Session>;
  abstract submit: (options: SubmitOptions) => Promise<Session>;
  abstract chat: (options: ChatOptions) => Promise<ChatResponse>;
  abstract navigate: (options: NavigateOptions) => Promise<Session>;
  abstract back: (options: BackOptions) => Promise<Session>;
  abstract simulate: (options: SimulateOptions) => Promise<Session>;
  abstract exportTimeline: (options: ExportTimelineOptions) => Promise<InterviewTimeline>;

  protected getRulesEngineUrl = (checksum?: string) => {
    return buildUrl(this.options.host, `decisionapi/rules-engine-script?checksum=${checksum}`);
  };

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

  getConnectedData = async <T = unknown>(options: AsyncOptions) => {
    const url = this.options.apiGetters?.getConnectedData
      ? this.options.apiGetters.getConnectedData(options)
      : buildUrl(this.options.host, "decisionapi/connection");

    const res = await this.api.post<T>(url, options);
    return res.data as T;
  };
}
