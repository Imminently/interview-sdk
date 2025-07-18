import type { AxiosInstance } from "axios";
import type { SessionInstance } from "./init";
import type {
	AttributeValues,
	ChatResponse,
	Navigate,
	Overrides,
	ProjectId,
	Session,
	SessionConfig,
	Simulate,
	StepId,
} from "./types";
import { buildUrl } from "./util";

export const create = async (
	api: AxiosInstance,
	project: ProjectId,
	options: SessionConfig = {},
) => {
	const { initialData, release, responseElements, sessionId, ...rest } =
		options;
	// const config: AxiosRequestConfig = {
	//   params: {
	//     interview
	//   }
	// };

	const postConfig = sessionId ? { params: { session: sessionId } } : undefined;

	const res = await api.post<Session>(
		buildUrl(project, release),
		{
			data: initialData ?? {},
			response: responseElements,
			...rest,
		},
		postConfig,
	);
	return res.data;
};

export const load = async (
	api: AxiosInstance,
	project: string,
	sessionId: string,
	interactionId?: string,
) => {
	const res = await api.patch<Session>(
		project,
		{},
		{ params: { session: sessionId, interaction: interactionId } },
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
export const submit = async (
	api: AxiosInstance,
	session: SessionInstance,
	data: AttributeValues,
	navigate: Navigate,
	overrides?: Overrides,
) => {
	const url =
		session.release === undefined
			? session.project
			: buildUrl(session.project, session.release);
	const res = await api.patch<Session>(
		url,
		{
			data,
			navigate: navigate || undefined,
			index: session.index,
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
export const chat = async (
	api: AxiosInstance,
	session: SessionInstance,
	message: string,
	goal: string,
	overrides?: Overrides,
	interactionId?: string | null,
): Promise<ChatResponse> => {
	const resolvedInteractionId =
		interactionId !== undefined ? interactionId : session.interactionId;
	const res = await api[resolvedInteractionId ? "patch" : "post"]<ChatResponse>(
		session.project,
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
export const navigate = async (
	api: AxiosInstance,
	session: SessionInstance,
	step: StepId,
	overrides?: Overrides,
) => {
	const res = await api.patch<Session>(
		session.project,
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

export const back = async (
	api: AxiosInstance,
	session: SessionInstance,
	overrides?: Overrides,
) => {
	const res = await api.patch<Session>(
		session.project,
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

export const postSimulate = async (
	api: AxiosInstance,
	session: SessionInstance,
	data: Partial<Simulate>,
) => {
	// Dynamic interactions are now on a post (due to new interaction behaviour in backend)
	const res = await api.post<AttributeValues>(
		buildUrl(session.project, session.release),
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

export const exportTimeline = async (
	api: AxiosInstance,
	session: SessionInstance,
) => {
	const res = await api.post<string>(
		session.project,
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
