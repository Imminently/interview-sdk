import { beforeEach, describe, expect, it } from "@jest/globals";
import pako from "pako";
import { MockInterviewBackend } from "../backend/mock-backend";
import {
  createLocalInterviewBackendMemoryStorage,
  LocalInterviewBackend,
  type LocalInterviewBackendStoredState,
} from "../backend/local-backend";
import type { RulesEngine, Session, SessionConfig } from "../types";

const releaseData = {
  id: "release-1",
  model: "model-1",
  interviews: [],
};

const rulesEngine: RulesEngine = {
  solve: async () => ({}),
};
const createStorage = () => createLocalInterviewBackendMemoryStorage();
const sessionData = (data: Record<string, unknown>) => data as Session["data"];
const attributeData = (data: Record<string, unknown>) => data as never;
const compressGraph = (graph: Record<string, unknown>) =>
  Array.from(pako.deflate(JSON.stringify(graph))) as unknown as Session["clientGraph"];
const createSession = (overrides: Partial<Session> = {}): Session =>
  ({
    sessionId: "server-session",
    interactionId: "server-interaction",
    interviewId: "interview-1",
    goal: "goal-1",
    model: "model-1",
    release: "release-1",
    reportId: "",
    status: "in-progress",
    context: { entity: "global" },
    data: {},
    state: { nodes: {} },
    localReleaseData: {
      ...releaseData,
      interviews: [
        {
          id: "interview-1",
          name: "Interview 1",
          goal: "goal-1",
          default: true,
        },
      ],
    },
    steps: [],
    screen: {
      id: "screen-1",
      title: "Screen 1",
      context: { entity: "global" },
      controls: [],
      attributes: [],
      allAttributes: [],
    },
    ...overrides,
  }) as Session;

const createSolveResult = (overrides: Record<string, unknown> = {}) => ({
  interview: {
    status: "in-progress",
    data: {},
    state: { nodes: {} },
    steps: [],
    screen: {
      id: "screen-1",
      title: "Screen 1",
      context: { entity: "global" },
      controls: [],
      attributes: [],
      allAttributes: [],
    },
    ...overrides,
  },
});

const createBackendWithApi = (solve: RulesEngine["solve"], interviewOverrides: Record<string, unknown> = {}) => {
  const post = async (..._args: unknown[]) => ({
    data: createSession({
      data: sessionData({ serverStarted: true }),
      clientGraph: "server-client-graph",
      localReleaseData: {
        ...releaseData,
        interviews: [
          {
            id: "interview-1",
            name: "Interview 1",
            goal: "goal-1",
            default: true,
            ...interviewOverrides,
          },
        ],
      },
    }),
  });
  const patch = async (..._args: unknown[]) => ({ data: createSession({ status: "complete", data: sessionData({ finalAnswer: "yes" }) }) });
  const api = { post, patch };
  MockInterviewBackend.configure({
    create: async (options) => {
      const { initialData, project, release, response, sessionId, ...rest } = options;
      const result = await api.post(
        [project, release].filter(Boolean).join("/"),
        {
          data: initialData ?? {},
          response,
          ...rest,
        },
        sessionId ? { params: { session: sessionId } } : undefined,
      );
      return result.data;
    },
    load: async (options) => {
      const { project, sessionId, interactionId, initialData, response, clientGraphBookmark, ...rest } = options;
      const result = await api.patch(
        project,
        { data: initialData ?? {}, response, clientGraphBookmark, ...rest },
        { params: { session: sessionId, interaction: interactionId } },
      );
      return result.data;
    },
    submit: async (options) => {
      const { session, data, navigate, overrides, clientGraphBookmark, localInterview } = options;
      const result = await api.patch(
        [session.model, session.release].filter(Boolean).join("/"),
        {
          data,
          navigate: navigate || undefined,
          index: session.index,
          clientGraphBookmark,
          localInterview,
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
      return result.data;
    },
  });
  const backend = new LocalInterviewBackend({
    host: "https://api.example.com",
    rulesEngine: { solve },
    storage: createStorage(),
  });

  (backend as unknown as { api: { post: typeof post; patch: typeof patch } }).api = {
    get post() {
      return api.post;
    },
    set post(nextPost) {
      api.post = nextPost;
    },
    get patch() {
      return api.patch;
    },
    set patch(nextPatch) {
      api.patch = nextPatch;
    },
  };

  return {
    backend,
    api,
  };
};

describe("LocalInterviewBackend", () => {
  beforeEach(() => {
    MockInterviewBackend.reset();
  });

  it("requires a host, rulesEngine, or rulesEngineScript", () => {
    expect(() => new LocalInterviewBackend({} as never)).toThrow(
      "LocalInterviewBackend requires host, rulesEngine, or rulesEngineScript",
    );
  });

  it("does not accept release data", () => {
    expect(() => new LocalInterviewBackend({ host: "http://localhost:3000", releaseData } as never)).toThrow(
      "LocalInterviewBackend does not accept releaseData",
    );
  });

  it("requires storage", () => {
    expect(() => new LocalInterviewBackend({ host: "http://localhost:3000" } as never)).toThrow(
      "LocalInterviewBackend requires storage",
    );
  });

  it("can be constructed with a host", () => {
    expect(() => new LocalInterviewBackend({ host: "http://localhost:3000", storage: createStorage() })).not.toThrow();
  });

  it("can be constructed with a rules engine", () => {
    expect(() => new LocalInterviewBackend({ rulesEngine, storage: createStorage() })).not.toThrow();
  });

  it("can be constructed with a rules engine script", () => {
    expect(() => new LocalInterviewBackend({ rulesEngineScript: "({ solve: async () => ({}) })", storage: createStorage() })).not.toThrow();
  });

  it("stores local session and interaction state in the provided storage", async () => {
    let state: LocalInterviewBackendStoredState | undefined;
    const storage = {
      load: () => state,
      save: (nextState: LocalInterviewBackendStoredState) => {
        state = nextState;
      },
    };
    const { backend } = createBackendWithApi(async () => createSolveResult({ data: { localAnswer: "yes" } }));
    const backendWithStorage = new LocalInterviewBackend({
      host: "https://api.example.com",
      rulesEngine: {
        solve: async () => createSolveResult({ data: { localAnswer: "yes" } }),
      },
      storage,
    });
    (backendWithStorage as unknown as { api: unknown }).api = (backend as unknown as { api: unknown }).api;
    (backendWithStorage as unknown as { remoteBackend: { api: unknown } }).remoteBackend.api = (
      backend as unknown as { remoteBackend: { api: unknown } }
    ).remoteBackend.api;

    const session = await backendWithStorage.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });

    expect(state?.session?.id).toBe("server-session");
    expect(state?.interaction?.id).toBe("server-interaction");

    await backendWithStorage.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(state?.session?.lastInteractionId).toBe("server-interaction");
  });

  it("loads a rules engine script function once", async () => {
    let loadCount = 0;
    const backend = new LocalInterviewBackend({
      storage: createStorage(),
      rulesEngineScript: () => {
        loadCount += 1;
        return "({ solve: async () => ({}) })";
      },
    });

    await backend.getRulesEngine();
    await backend.getRulesEngineRuntime();
    await backend.getRulesEngine();

    expect(loadCount).toBe(1);
  });

  it("uses the session rules engine checksum when loading the local runtime", async () => {
    const backend = new LocalInterviewBackend({
      host: "https://api.example.com",
      storage: createStorage(),
    });
    const getCalls: unknown[][] = [];
    (backend as unknown as { api: { get: (...args: unknown[]) => Promise<{ data: string }> } }).api = {
      get: async (...args) => {
        getCalls.push(args);
        return { data: "({ solve: async () => ({}) })" };
      },
    };

    await backend.getRulesEngineRuntime({ checksum: "checksum-1" });
    await backend.getRulesEngineRuntime({ checksum: "checksum-2" });

    expect(getCalls).toHaveLength(1);
    expect(getCalls[0][0]).toBe("https://api.example.com/decisionapi/rules-engine-script?checksum=checksum-1");
  });

  it("starts the session on the server and returns the server snapshot before local page turns", async () => {
    const solveCalls: unknown[] = [];
    const { backend, api } = createBackendWithApi(async (payload) => {
      solveCalls.push(payload);
      return createSolveResult({ data: { localAnswer: "yes" } });
    });
    const postCalls: unknown[][] = [];
    const patchCalls: unknown[][] = [];
    api.post = async (...args) => {
      postCalls.push(args);
      return {
        data: createSession({
          data: sessionData({ serverStarted: true }),
          localReleaseData: {
            ...releaseData,
            interviews: [
              {
                id: "interview-1",
                name: "Interview 1",
                goal: "goal-1",
                default: true,
              },
            ],
          },
        }),
      };
    };
    api.patch = async (...args) => {
      patchCalls.push(args);
      return { data: createSession({ status: "complete" }) };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
      initialData: { initialAnswer: "yes" },
    });

    expect(postCalls).toHaveLength(1);
    expect(postCalls[0][0]).toBe("model-1/release-1");
    expect(postCalls[0][1]).toEqual(
      expect.objectContaining({
        data: { initialAnswer: "yes" },
        localInterview: true,
      }),
    );
    expect(patchCalls).toHaveLength(0);
    expect(session.sessionId).toBe("server-session");
    expect(session.interactionId).toBe("server-interaction");
    expect(solveCalls).toHaveLength(0);
  });

  it("uses server-provided local release data when constructed without release data", async () => {
    const post = async () => ({
      data: createSession({
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });
    const patch = async () => ({ data: createSession({ status: "complete" }) });
    MockInterviewBackend.configure({
      create: async () => (await post()).data,
      submit: async () => (await patch()).data,
    });
    const backend = new LocalInterviewBackend({
      host: "https://api.example.com",
      rulesEngine,
      storage: createStorage(),
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });

    expect(session.interviewId).toBe("interview-1");
  });

  it("stores a remote-created local interview snapshot explicitly before local page turns", async () => {
    const solveData: unknown[] = [];
    const storageState: { current?: LocalInterviewBackendStoredState } = {};
    const storage = {
      load: () => storageState.current,
      save: (nextState: LocalInterviewBackendStoredState) => {
        storageState.current = nextState;
      },
    };
    const backend = new LocalInterviewBackend({
      host: "https://api.example.com",
      storage,
      rulesEngine: {
        solve: async (payload) => {
          solveData.push(payload.session.data);
          return createSolveResult({ data: { localAnswer: "yes" } });
        },
      },
    });
    const sessionConfig: SessionConfig = {
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
      goal: "goal-1",
    };
    const remoteSession = createSession({
      __deprecatedSessionData: {
        event_days: [{ "@id": "2026-07-11", date: "2026-07-11" }],
      },
      clientGraph: "server-client-graph",
    });

    backend.storeSessionSnapshot(remoteSession, sessionConfig);
    const nextSession = await backend.submit({
      session: remoteSession,
      data: attributeData({ answer: "yes" }),
      navigate: true,
    });

    expect(storageState.current?.releaseData?.id).toBe("release-1");
    expect(storageState.current?.session?.id).toBe("server-session");
    expect(storageState.current?.interaction?.id).toBe("server-interaction");
    expect(storageState.current?.session?.clientGraph).toBe("server-client-graph");
    expect(storageState.current?.sessionMeta).toEqual(
      expect.objectContaining({
        model: "model-1",
        release: "release-1",
      }),
    );
    expect(storageState.current).not.toHaveProperty("sessionSnapshot");
    expect(solveData).toEqual([
      {
        event_days: [{ "@id": "2026-07-11", date: "2026-07-11" }],
      },
    ]);
    expect(nextSession.sessionId).toBe("server-session");
  });

  it("does not implicitly hydrate local storage from submit session options", async () => {
    const backend = new LocalInterviewBackend({
      host: "https://api.example.com",
      rulesEngine,
      storage: createStorage(),
    });

    await expect(
      backend.submit({
        session: createSession({
          __deprecatedSessionData: { answer: "server-data" },
        }),
        data: attributeData({ answer: "yes" }),
        navigate: true,
      }),
    ).rejects.toThrow("No local session has been created");
  });

  it("uses server-provided full session data as the local baseline", async () => {
    const solveData: unknown[] = [];
    const { backend, api } = createBackendWithApi(async (payload) => {
      solveData.push(payload.session.data);
      return createSolveResult({ data: { localAnswer: "yes" } });
    });
    api.post = async () => ({
      data: createSession({
        data: sessionData({}),
        __deprecatedSessionData: { industries: [{ "@id": 1, name: "Education" }] },
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      } as Partial<Session>),
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(solveData[0]).toEqual({
      industries: [{ "@id": 1, name: "Education" }],
    });
  });

  it("keeps parent-scoped screen data separate from canonical stored session data", async () => {
    let state: LocalInterviewBackendStoredState | undefined;
    const storage = {
      load: () => state,
      save: (nextState: LocalInterviewBackendStoredState) => {
        state = nextState;
      },
    };
    const { backend, api } = createBackendWithApi(async () =>
      createSolveResult({
        data: {
          "@parent": "event_days/2026-07-11",
          attendees: "100",
          parking: true,
        },
      }),
    );
    const backendWithStorage = new LocalInterviewBackend({
      host: "https://api.example.com",
      rulesEngine: (backend as unknown as { rulesEngine: RulesEngine }).rulesEngine ?? rulesEngine,
      storage,
    });
    (backendWithStorage as unknown as { api: unknown }).api = (backend as unknown as { api: unknown }).api;
    (backendWithStorage as unknown as { remoteBackend: { api: unknown } }).remoteBackend.api = (
      backend as unknown as { remoteBackend: { api: unknown } }
    ).remoteBackend.api;
    api.post = async () => ({
      data: createSession({
        data: sessionData({
          "@parent": "event_days/2026-07-11",
          attendees: { type: "auto" },
        }),
        __deprecatedSessionData: {
          event_days: [
            { "@id": "2026-07-11", date: "2026-07-11" },
            { "@id": "2026-07-12", date: "2026-07-12" },
          ],
        },
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });

    const session = await backendWithStorage.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    expect(session.data).toEqual({
      "@parent": "event_days/2026-07-11",
      attendees: { type: "auto" },
    });
    expect(state?.session?.data).toEqual({
      event_days: [
        { "@id": "2026-07-11", date: "2026-07-11" },
        { "@id": "2026-07-12", date: "2026-07-12" },
      ],
    });

    const nextSession = await backendWithStorage.submit({
      session,
      data: attributeData({
        "@parent": "event_days/2026-07-11",
        attendees: "100",
        parking: true,
      }),
      navigate: true,
    });

    expect(nextSession.data).toEqual({
      "@parent": "event_days/2026-07-11",
      attendees: "100",
      parking: true,
    });
    expect(state?.session?.data).toEqual({
      event_days: [
        { "@id": "2026-07-11", date: "2026-07-11" },
        { "@id": "2026-07-12", date: "2026-07-12" },
      ],
    });
  });

  it("updates canonical stored session data only from local sessionUpdate data", async () => {
    let state: LocalInterviewBackendStoredState | undefined;
    const storage = {
      load: () => state,
      save: (nextState: LocalInterviewBackendStoredState) => {
        state = nextState;
      },
    };
    const solveData: unknown[] = [];
    let solveCount = 0;
    const { backend, api } = createBackendWithApi(async (payload) => {
      solveData.push(payload.session.data);
      solveCount += 1;
      return {
        ...createSolveResult({
          data: {
            "@parent": solveCount === 1 ? "event_days/2026-07-11" : "event_days/2026-07-12",
            attendees: solveCount === 1 ? "100" : "75",
          },
        }),
        sessionUpdate: solveCount === 1 ? {
          data: {
            event_days: [
              {
                "@id": "2026-07-11",
                date: "2026-07-11",
                attendees: "100",
              },
              { "@id": "2026-07-12", date: "2026-07-12" },
            ],
          },
        } : undefined,
      };
    });
    const backendWithStorage = new LocalInterviewBackend({
      host: "https://api.example.com",
      rulesEngine: (backend as unknown as { rulesEngine: RulesEngine }).rulesEngine ?? rulesEngine,
      storage,
    });
    (backendWithStorage as unknown as { api: unknown }).api = (backend as unknown as { api: unknown }).api;
    (backendWithStorage as unknown as { remoteBackend: { api: unknown } }).remoteBackend.api = (
      backend as unknown as { remoteBackend: { api: unknown } }
    ).remoteBackend.api;
    api.post = async () => ({
      data: createSession({
        data: sessionData({
          "@parent": "event_days/2026-07-11",
          attendees: { type: "auto" },
        }),
        __deprecatedSessionData: {
          event_days: [
            { "@id": "2026-07-11", date: "2026-07-11" },
            { "@id": "2026-07-12", date: "2026-07-12" },
          ],
        },
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });

    const session = await backendWithStorage.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const nextSession = await backendWithStorage.submit({
      session,
      data: attributeData({
        "@parent": "event_days/2026-07-11",
        attendees: "100",
      }),
      navigate: true,
    });
    await backendWithStorage.navigate({
      session: nextSession,
      step: {
        stepId: "day-info",
        instancePath: "event_days/2026-07-12",
      },
    });

    expect(solveData[0]).toEqual({
      event_days: [
        { "@id": "2026-07-11", date: "2026-07-11" },
        { "@id": "2026-07-12", date: "2026-07-12" },
      ],
    });
    expect(solveData[1]).toEqual({
      event_days: [
        {
          "@id": "2026-07-11",
          date: "2026-07-11",
          attendees: "100",
        },
        { "@id": "2026-07-12", date: "2026-07-12" },
      ],
    });
    expect(state?.session?.data).toEqual(solveData[1]);
  });

  it("uses the server client graph as the release graph for local page turns", async () => {
    const releaseGraphs: unknown[] = [];
    const { backend, api } = createBackendWithApi(async (_payload, _releaseId, externalData) => {
      releaseGraphs.push(externalData.getRelease().rule_graph);
      return createSolveResult({ data: { localAnswer: "yes" } });
    });
    api.post = async () => ({
      data: createSession({
        data: sessionData({ serverStarted: true }),
        clientGraph: "remote-client-graph",
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(releaseGraphs).toEqual(["remote-client-graph"]);
  });

  it("decompresses the server client graph before passing it to the local rules engine", async () => {
    const ruleGraphs: unknown[] = [];
    const graph = { nodes: [{ v: "node-1", value: { id: "node-1" } }], edges: [] };
    const { backend, api } = createBackendWithApi(async (_payload, _releaseId, externalData) => {
      ruleGraphs.push(externalData.getRelease().rule_graph);
      return createSolveResult({ data: { localAnswer: "yes" } });
    });
    api.post = async () => ({
      data: createSession({
        data: sessionData({ serverStarted: true }),
        clientGraph: compressGraph(graph),
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(ruleGraphs).toEqual([graph]);
  });

  it("forces local interactions to serverSideDynamic false", async () => {
    const interactions: unknown[] = [];
    const { backend } = createBackendWithApi(async (payload) => {
      interactions.push(payload.interaction);
      return createSolveResult({ data: { localAnswer: "yes" } });
    }, { serverSideDynamic: true });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(interactions[0]).toEqual(
      expect.objectContaining({
        serverSideDynamic: false,
        meta: expect.objectContaining({ serverSideDynamic: false }),
      }),
    );
  });

  it("uses the latest local client graph for subsequent page turns", async () => {
    const releaseGraphs: unknown[] = [];
    let solveCount = 0;
    const { backend, api } = createBackendWithApi(async (_payload, _releaseId, externalData) => {
      solveCount += 1;
      releaseGraphs.push(externalData.getRelease().rule_graph);
      return createSolveResult({
        clientGraph: solveCount === 1 ? "local-client-graph-2" : "local-client-graph-3",
        data: { localAnswer: "yes" },
      });
    });
    api.post = async () => ({
      data: createSession({
        data: sessionData({ serverStarted: true }),
        clientGraph: "remote-client-graph",
        localReleaseData: {
          ...releaseData,
          interviews: [
            {
              id: "interview-1",
              name: "Interview 1",
              goal: "goal-1",
              default: true,
            },
          ],
        },
      }),
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });
    await backend.submit({
      session,
      data: attributeData({ thirdAnswer: "yes" }),
      navigate: true,
    });

    expect(releaseGraphs).toEqual(["remote-client-graph", "local-client-graph-2"]);
  });

  it("keeps in-progress page turns local", async () => {
    const { backend, api } = createBackendWithApi(async () => createSolveResult({ data: { localAnswer: "yes" } }));
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return { data: createSession({ status: "complete" }) };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(patchCalls).toHaveLength(0);
  });

  it("submits caller-provided data when explicitly submitting remotely", async () => {
    let solveCount = 0;
    const { backend, api } = createBackendWithApi(async () => {
      solveCount += 1;
      return {
        ...createSolveResult({ data: { screenAnswer: "yes" } }),
        sessionUpdate: {
          data: {
            finalAnswer: "yes",
          },
        },
      };
    });
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return { data: createSession({ status: "in-progress", data: sessionData({ finalAnswer: "yes" }) }) };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const localSession = await backend.submit({
      session,
      data: attributeData({ screenAnswer: "yes" }),
      navigate: true,
    });
    await backend.submit({
      session: localSession,
      data: attributeData({ explicitAnswer: "caller-data" }),
      remote: true,
    });

    expect(solveCount).toBe(1);
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][1]).toEqual(
      expect.objectContaining({
        data: { explicitAnswer: "caller-data" },
      }),
    );
  });

  it("omits submit navigate true so Rust performs default next navigation", async () => {
    const responseElements: unknown[] = [];
    const { backend } = createBackendWithApi(async (payload) => {
      responseElements.push(payload.responseElements);
      return createSolveResult({
        steps: [
          { id: "step-1", title: "Step 1", current: true, visitable: true },
          { id: "step-2", title: "Step 2", current: false, visitable: true },
        ],
        current_step: "step-1",
      });
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.submit({
      session,
      data: attributeData({ secondAnswer: "yes" }),
      navigate: true,
    });

    expect(responseElements[0]).toEqual([
      expect.objectContaining({
        type: "interview",
        navigate: undefined,
      }),
    ]);
  });

  it("normalizes local navigation targets to option objects for Rust", async () => {
    const responseElements: unknown[] = [];
    const { backend } = createBackendWithApi(async (payload) => {
      responseElements.push(payload.responseElements);
      return createSolveResult({
        steps: [
          { id: "step-1", title: "Step 1", current: true, visitable: true },
          { id: "step-2", title: "Step 2", current: false, visitable: true },
        ],
        current_step: "step-2",
      });
    });

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    await backend.navigate({
      session,
      step: {
        stepId: "step-2",
        instancePath: "event_days/2026-07-02",
      },
    });

    expect(responseElements[0]).toEqual([
      expect.objectContaining({
        type: "interview",
        navigate: {
          stepId: "step-2",
          instancePath: "event_days/2026-07-02",
        },
      }),
    ]);
  });

  it("maps top-level solve reporting onto the returned local session", async () => {
    const { backend } = createBackendWithApi(async () => ({
      ...createSolveResult({
        reporting: {
          stale: {
            value: "nested-interview-reporting",
          },
        },
      }),
      reporting: {
        "role-usage": {
          value: 2,
        },
      },
    }));

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const nextSession = await backend.submit({
      session,
      data: attributeData({ answer: "yes" }),
      navigate: "step-1",
      overrides: {
        response: [{ type: "attributes", ids: ["role-usage"] }],
      },
    });

    expect(nextSession.reporting).toEqual({
      "role-usage": {
        value: 2,
      },
    });
  });

  it("updates the server once when the local interview completes", async () => {
    let solveCount = 0;
    const { backend, api } = createBackendWithApi(async () => {
      solveCount += 1;
      return {
        ...createSolveResult({
          status: solveCount === 1 ? "in-progress" : "complete",
          data: { finalAnswer: "yes" },
          ...(solveCount === 1
            ? {}
            : {
                screen: {
                  id: "step-complete",
                  title: "Complete",
                  context: { entity: "global" },
                  controls: [],
                  attributes: [],
                  allAttributes: [],
                },
                steps: [
                  {
                    id: "step-complete",
                    title: "Complete",
                    context: { entity: "global" },
                    current: true,
                    complete: false,
                    visited: false,
                    skipped: false,
                    visitable: true,
                    special: { type: "complete" },
                  },
                ],
              }),
        }),
        sessionUpdate: {
          data: { finalAnswer: "yes" },
        },
      };
    });
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return { data: createSession({ status: "complete", data: sessionData({ finalAnswer: "yes" }) }) };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const completeSession = await backend.submit({
      session,
      data: attributeData({ finalAnswer: "yes" }),
      navigate: true,
    });
    await backend.submit({
      session: completeSession,
      data: attributeData({ finalAnswer: "yes" }),
      navigate: true,
    });

    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][0]).toBe("model-1/release-1");
    expect(patchCalls[0][1]).toEqual(
      expect.objectContaining({
        data: { finalAnswer: "yes" },
      }),
    );
    expect(patchCalls[0][2]).toEqual(
      expect.objectContaining({
        params: {
          session: "server-session",
          interaction: "server-interaction",
        },
      }),
    );
  });

  it("does not sync to the server when complete status is reported without a complete screen", async () => {
    const { backend, api } = createBackendWithApi(async () => ({
      ...createSolveResult({
        status: "complete",
        data: { userAnswer: "yes" },
        screen: {
          id: "user-input",
          title: "User input",
          context: { entity: "global" },
          controls: [],
          attributes: [],
          allAttributes: [],
        },
        steps: [
          {
            id: "user-input",
            title: "User input",
            context: { entity: "global" },
            current: true,
            complete: false,
            visited: false,
            skipped: false,
            visitable: true,
          },
        ],
      }),
      sessionUpdate: {
        data: { userAnswer: "yes" },
      },
    }));
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return {
        data: createSession({
          status: "complete",
          data: sessionData({ userAnswer: "yes" }),
          screen: {
            id: "step-complete",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
        }),
      };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const localSession = await backend.submit({
      session,
      data: attributeData({ userAnswer: "yes" }),
      navigate: true,
    });

    expect(localSession.status).toBe("in-progress");
    expect(localSession.screen?.id).toBe("user-input");
    expect(patchCalls).toHaveLength(0);
  });

  it("syncs to the complete step when goal resolution reports complete before local navigation", async () => {
    let solveCount = 0;
    const { backend, api } = createBackendWithApi(async () => {
      solveCount += 1;
      return {
        ...createSolveResult({
          status: "complete",
          data: { userAnswer: "yes" },
          screen: {
            id: "user-input",
            title: "User input",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
          steps: [
            {
              id: "user-input",
              title: "User input",
              context: { entity: "global" },
              current: true,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
            },
            {
              id: "step-complete",
              title: "Complete",
              context: { entity: "global" },
              current: false,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
              special: { type: "complete" },
            },
          ],
        }),
        sessionUpdate: {
          data: { userAnswer: "yes" },
        },
      };
    });
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return {
        data: createSession({
          status: "complete",
          data: sessionData({ userAnswer: "yes" }),
          screen: {
            id: "step-complete",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
        }),
      };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const completeSession = await backend.submit({
      session,
      data: attributeData({ userAnswer: "yes" }),
      navigate: true,
    });

    expect(solveCount).toBe(1);
    expect(completeSession.status).toBe("complete");
    expect(completeSession.screen?.id).toBe("step-complete");
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][1]).toEqual(expect.objectContaining({ navigate: { stepId: "step-complete" } }));
    expect(patchCalls[0][1]).toEqual(
      expect.objectContaining({
        localInterview: {
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "user-input",
              current: true,
            }),
          ]),
        },
      }),
    );
  });

  it("syncs completion with a single explicit complete-step submit", async () => {
    const { backend, api } = createBackendWithApi(async () => ({
      ...createSolveResult({
        status: "complete",
        data: { finalAnswer: "yes" },
        screen: {
          id: "complete_screen",
          title: "Complete",
          context: { entity: "global" },
          controls: [],
          attributes: [],
          allAttributes: [],
        },
        steps: [
          {
            id: "user-input",
            title: "User input",
            context: { entity: "global" },
            current: false,
            complete: true,
            visited: true,
            skipped: false,
            visitable: true,
          },
          {
            id: "complete_screen",
            title: "Complete",
            context: { entity: "global" },
            current: true,
            complete: false,
            visited: false,
            skipped: false,
            visitable: true,
            special: { type: "complete" },
          },
        ],
      }),
      sessionUpdate: {
        data: { finalAnswer: "yes" },
      },
    }));
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return {
        data: createSession({
          status: "complete",
          data: sessionData({ finalAnswer: "yes" }),
          screen: {
            id: "complete_screen",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
        }),
      };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const completeSession = await backend.submit({
      session,
      data: attributeData({ finalAnswer: "yes" }),
      navigate: true,
    });

    expect(completeSession.status).toBe("complete");
    expect(patchCalls).toHaveLength(1);
    expect(patchCalls[0][1]).toEqual(expect.objectContaining({ navigate: { stepId: "complete_screen" } }));
    expect(patchCalls[0][1]).toEqual(
      expect.objectContaining({
        localInterview: {
          steps: expect.arrayContaining([
            expect.objectContaining({
              id: "user-input",
              visited: true,
            }),
          ]),
        },
      }),
    );
  });

  it("syncs again after navigating back from the complete screen and completing again", async () => {
    const solveResults = [
      {
        ...createSolveResult({
          status: "complete",
          data: { userAnswer: "first" },
          screen: {
            id: "step-complete",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
          steps: [
            {
              id: "user-input",
              title: "User input",
              context: { entity: "global" },
              current: false,
              complete: true,
              visited: true,
              skipped: false,
              visitable: true,
            },
            {
              id: "step-complete",
              title: "Complete",
              context: { entity: "global" },
              current: true,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
              special: { type: "complete" },
            },
          ],
        }),
        sessionUpdate: { data: { userAnswer: "first" } },
      },
      {
        ...createSolveResult({
          status: "complete",
          data: { userAnswer: "first" },
          screen: {
            id: "user-input",
            title: "User input",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
          steps: [
            {
              id: "user-input",
              title: "User input",
              context: { entity: "global" },
              current: true,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
            },
            {
              id: "step-complete",
              title: "Complete",
              context: { entity: "global" },
              current: false,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
              special: { type: "complete" },
            },
          ],
        }),
        sessionUpdate: { data: { userAnswer: "first" } },
      },
      {
        ...createSolveResult({
          status: "complete",
          data: { userAnswer: "second" },
          screen: {
            id: "step-complete",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
          steps: [
            {
              id: "user-input",
              title: "User input",
              context: { entity: "global" },
              current: false,
              complete: true,
              visited: true,
              skipped: false,
              visitable: true,
            },
            {
              id: "step-complete",
              title: "Complete",
              context: { entity: "global" },
              current: true,
              complete: false,
              visited: false,
              skipped: false,
              visitable: true,
              special: { type: "complete" },
            },
          ],
        }),
        sessionUpdate: { data: { userAnswer: "second" } },
      },
    ];
    const { backend, api } = createBackendWithApi(async () => solveResults.shift());
    const patchCalls: unknown[][] = [];
    api.patch = async (...args) => {
      patchCalls.push(args);
      return {
        data: createSession({
          status: "complete",
          data: sessionData((args[1] as { data?: Record<string, unknown> }).data ?? {}),
          screen: {
            id: "step-complete",
            title: "Complete",
            context: { entity: "global" },
            controls: [],
            attributes: [],
            allAttributes: [],
          },
        }),
      };
    };

    const session = await backend.create({
      project: "model-1",
      release: "release-1",
      interview: "interview-1",
    });
    const firstCompleteSession = await backend.submit({
      session,
      data: attributeData({ userAnswer: "first" }),
      navigate: true,
    });
    const backSession = await backend.back({
      session: firstCompleteSession,
    });
    const secondCompleteSession = await backend.submit({
      session: backSession,
      data: attributeData({ userAnswer: "second" }),
      navigate: true,
    });

    expect(backSession.status).toBe("in-progress");
    expect(secondCompleteSession.status).toBe("complete");
    expect(patchCalls).toHaveLength(2);
    expect(patchCalls[0][1]).toEqual(expect.objectContaining({ data: { userAnswer: "first" } }));
    expect(patchCalls[1][1]).toEqual(expect.objectContaining({ data: { userAnswer: "second" } }));
  });
});
