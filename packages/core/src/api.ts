import type { AxiosInstance } from "axios";
import type {
  AttributeValues,
  ChatResponse,
  Navigate,
  Overrides,
  Session,
  SessionConfig,
  Simulate,
  StepId,
} from "./types";
import { buildUrl } from "./util";

export const create = async (api: AxiosInstance, options: SessionConfig = {}) => {
  const { initialData, project, release, responseElements, sessionId, ...rest } = options;

  if (!project) {
    throw new Error("Project ID is required to create a session.");
  }

  const res = await api.post<Session>(
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

export const load = async (api: AxiosInstance, options: SessionConfig) => {
  const { project, sessionId, interactionId, initialData } = options;

  if (!project) {
    throw new Error("Project ID is required to load a session.");
  }

  const res = await api.patch<Session>(
    project,
    { data: initialData ?? {} },
    {
      params: { session: sessionId, interaction: interactionId }
    }
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
  session: Session,
  data: AttributeValues,
  navigate: Navigate,
  overrides?: Overrides,
) => {
  const url = session.release === undefined ? session.model : buildUrl(session.model, session.release);
  const res = await api.patch<Session>(
    url,
    { data, navigate: navigate || undefined, index: session.index, ...overrides },
    { params: { session: session.sessionId, interaction: session.interactionId } },
  );
  return res.data;
};

/**
 * Send a generative chat message
 */
export const chat = async (
  api: AxiosInstance,
  session: Session,
  message: string,
  goal: string,
  overrides?: Overrides,
  interactionId?: string | null,
): Promise<ChatResponse> => {
  const resolvedInteractionId = interactionId !== undefined ? interactionId : session.interactionId;
  const res = await api[resolvedInteractionId ? "patch" : "post"]<ChatResponse>(
    session.model,
    {
      prompt: message,
      turbo: false,
      mode: "generative",
      aiOptions: { model: "gpt-4o", temperature: 0.8 },
      goal,
      ...overrides,
    },
    { params: { session: session.sessionId, interaction: resolvedInteractionId || undefined } },
  );
  return res.data;
};

/**
 * Navigate to a specific step.
 *
 * @param step The desired step ID
 */
export const navigate = async (api: AxiosInstance, session: Session, step: StepId, overrides?: Overrides) => {
  const res = await api.patch<Session>(
    session.model,
    { navigate: step, ...overrides },
    { params: { session: session.sessionId, interaction: session.interactionId } },
  );
  return res.data;
};

export const back = async (api: AxiosInstance, session: Session, overrides?: Overrides) => {
  const res = await api.patch<Session>(
    session.model,
    { navigate: "@back", ...overrides },
    { params: { session: session.sessionId, interaction: session.interactionId } },
  );
  return res.data;
};

export const postSimulate = async (api: AxiosInstance, session: Session, data: Partial<Simulate>) => {
  // Dynamic interactions are now on a post (due to new interaction behaviour in backend)
  const res = await api.post<AttributeValues>(
    buildUrl(session.model, session.release),
    {
      mode: "api",
      save: false,
      ...data,
    },
    {
      params: { session: session.sessionId, interaction: session.interactionId },
    },
  );
  return res.data;
};

export const exportTimeline = async (api: AxiosInstance, session: Session) => {
  const res = await api.post<string>(
    session.model,
    {
      exportTimeline: true,
    },
    {
      params: { session: session.sessionId, interaction: session.interactionId },
    },
  );
  return res.data;
};
