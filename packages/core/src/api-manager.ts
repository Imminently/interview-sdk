import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
	AttributeValues,
	AuthConfigGetter,
	ChatResponse,
	Navigate,
	Overrides,
	Session,
	SessionConfig,
	StepId,
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
		submit?: (session: Session, data: AttributeValues, navigate: Navigate) => string;
		chat?: (session: Session, message: string, goal: string) => string;
		navigate?: (session: Session, step: StepId) => string;
		back?: (session: Session) => string;
		simulate?: (session: Session, data: Partial<AttributeValues>) => string;
		exportTimeline?: (session: Session) => string;
		getRulesEngine?: (checksum?: string) => string;
	}
}

export class ApiManager {
	protected api: AxiosInstance;
	protected options: ApiManagerOptions;

	constructor(options: ApiManagerOptions) {
		// create the api instance
		const { host, auth, overrides = {}, path = defaultPath } = options;
		const baseUrl = buildUrl(
			host,
			...(typeof path === "string" ? [path] : path),
		);
		this.api = createApiInstance(baseUrl, auth, overrides);
		this.options = options;
	}

	create = async (options: SessionConfig = {}) => {
		const {
			initialData,
			project,
			release,
			responseElements,
			sessionId,
			...rest
		} = options;

		const url = this.options.apiGetters?.create
			? this.options.apiGetters.create(options)
			: buildUrl(project, release);

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
		const {
			project,
			sessionId,
			interactionId,
			initialData,
			clientGraphBookmark,
		} = options;

		const url = this.options.apiGetters?.load
			? this.options.apiGetters.load(options)
			: buildUrl(project);

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
	submit = async (
		session: Session,
		data: AttributeValues,
		navigate: Navigate,
		overrides?: Overrides,
		clientGraphBookmark?: string,
	) => {
		const url =
			this.options.apiGetters?.submit
				? this.options.apiGetters.submit(session, data, navigate)
				: buildUrl(session.model, session.release);
		const res = await this.api.patch<Session>(
			url,
			{
				data,
				navigate: navigate || undefined,
				index: session.index,
				clientGraphBookmark,
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
	chat = async (
		session: Session,
		message: string,
		goal: string,
		overrides?: Overrides,
		interactionId?: string | null,
	): Promise<ChatResponse> => {
		const resolvedInteractionId =
			interactionId !== undefined ? interactionId : session.interactionId;

		const url =
			this.options.apiGetters?.chat
				? this.options.apiGetters.chat(session, message, goal)
				: buildUrl(session.model);

		const res = await this.api[
			resolvedInteractionId ? "patch" : "post"
		]<ChatResponse>(
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
	navigate = async (session: Session, step: StepId, overrides?: Overrides) => {
		const url = this.options.apiGetters?.navigate
			? this.options.apiGetters.navigate(session, step)
			: buildUrl(session.model);
		const res = await this.api.patch<Session>(
			url,
			{ navigate: step, ...overrides },
			{
				params: {
					session: session.sessionId,
					interaction: session.interactionId,
				},
			},
		);
		return res.data;
	};

	back = async (session: Session, overrides?: Overrides) => {
		const url = this.options.apiGetters?.back
			? this.options.apiGetters.back(session)
			: buildUrl(session.model);
		const res = await this.api.patch<Session>(
			url,
			{ navigate: "@back", ...overrides },
			{
				params: {
					session: session.sessionId,
					interaction: session.interactionId,
				},
			},
		);
		return res.data;
	};

	simulate = async (session: Session, data: Partial<AttributeValues>) => {
		const url = this.options.apiGetters?.simulate
			? this.options.apiGetters.simulate(session, data)
			: buildUrl(session.model, session.release);
		// Dynamic interactions are now on a post (due to new interaction behaviour in backend)
		const res = await this.api.post<Session>(
			url,
			{
				mode: "api",
				save: false,
				...data,
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

	exportTimeline = async (session: Session) => {
		const url = this.options.apiGetters?.exportTimeline
			? this.options.apiGetters.exportTimeline(session)
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
		return buildUrl(
			this.options.host,
			`decisionapi/rules-engine-script?checksum=${checksum}`,
		);
	};

	/**
	 * Fetch the rules engine.
	 * If you want to override the URL, you can do so by overriding the `getRulesEngineUrl` method.
	 * @param checksum Optional checksum to fetch a specific version of the rules engine script
	 * @returns The rules engine script as a string
	 */
	getRulesEngine = async (checksum?: string) => {
		const url = this.options.apiGetters?.getRulesEngine
			? this.options.apiGetters.getRulesEngine(checksum)
			: this.getRulesEngineUrl(checksum);

		const res = await this.api.get(url, {
			adapter: "fetch",
			fetchOptions: { cache: "force-cache" },
		});
		return res.data as string;
	};
}
