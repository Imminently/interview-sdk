import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type {
	AttributeValues,
	AuthConfigGetter,
	ChatResponse,
	Navigate,
	Overrides,
	Session,
	SessionConfig,
	Simulate,
	StepId,
} from "./types";
import { buildUrl, createApiInstance } from "./util";

const defaultPath = ["decisionapi", "session"];

export interface ApiManagerOptions {
	host: string;
	path?: string | string[];
	auth?: AuthConfigGetter;
	overrides?: AxiosRequestConfig;
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

		if (!project) {
			throw new Error("Project ID is required to create a session.");
		}

		const res = await this.api.post<Session>(
			buildUrl(project, release),
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

		if (!project) {
			throw new Error("Project ID is required to load a session.");
		}

		const res = await this.api.patch<Session>(
			project,
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
			session.release === undefined
				? session.model
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
		const res = await this.api[
			resolvedInteractionId ? "patch" : "post"
		]<ChatResponse>(
			session.model,
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
		const res = await this.api.patch<Session>(
			session.model,
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
		const res = await this.api.patch<Session>(
			session.model,
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
		// Dynamic interactions are now on a post (due to new interaction behaviour in backend)
		const res = await this.api.post<Session>(
			buildUrl(session.model, session.release),
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
		const res = await this.api.post<string>(
			session.model,
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
		const res = await this.api.get(this.getRulesEngineUrl(checksum), {
			adapter: "fetch",
			fetchOptions: { cache: "force-cache" },
		});
		return res.data as string;
	};
}
