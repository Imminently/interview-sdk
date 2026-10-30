import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { StaleResponseError, getEchoedCorrelationId } from "../backend/correlation";
import { RemoteInterviewBackend } from "../backend/remote-backend";
import type { Session } from "../types";

const session = {
  sessionId: "session-1",
  interactionId: "interaction-1",
  model: "model-1",
  release: "release-1",
  data: { "@parent": "global" },
  screen: { id: "screen-1", controls: [] },
} as unknown as Session;

type Echo = "header" | "body" | "none" | ((sent: string) => Record<string, string>);

/** Builds a remote backend whose requests are answered by a fake adapter instead of the network. */
const createBackend = (echo: Echo = "header") => {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async (config) => {
    requests.push(config);
    const sent = config.headers["X-Correlation-Id"] as string;
    const headers = typeof echo === "function" ? echo(sent) : echo === "header" ? { "x-correlation-id": sent } : {};
    const data = { ...session, ...(echo === "body" ? { correlationId: sent } : {}) };
    return { data, status: 200, statusText: "OK", headers, config };
  };
  const backend = new RemoteInterviewBackend({ host: "https://api.example.com", overrides: { adapter } });
  return { backend, requests };
};

describe("RemoteInterviewBackend correlation", () => {
  const nodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // The remote backend swaps itself for the mock backend under NODE_ENV=test
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = nodeEnv;
  });

  it("tags each request with a unique id in both the header and the query string", async () => {
    const { backend, requests } = createBackend();

    await backend.submit({ session, data: {} });
    await backend.submit({ session, data: {} });

    const [first, second] = requests;
    // The query param is what makes the URL unique, so no browser or proxy cache can replay an earlier response
    expect(first.params.correlationId).toBe(first.headers["X-Correlation-Id"]);
    expect(first.params).toMatchObject({ session: "session-1", interaction: "interaction-1" });
    expect(second.params.correlationId).not.toBe(first.params.correlationId);
  });

  it("uses the caller's id for simulate so the manager can match the response", async () => {
    const { backend, requests } = createBackend();

    await backend.simulate({ session, payload: {}, correlationId: "dynamic-1" });

    expect(requests[0].headers["X-Correlation-Id"]).toBe("dynamic-1");
  });

  it("accepts a response echoing the id in the body, or not at all", async () => {
    // Body echo covers handlers that drop response headers, and no echo covers backends that predate the header
    await expect(createBackend("body").backend.submit({ session, data: {} })).resolves.toBeDefined();
    await expect(createBackend("none").backend.submit({ session, data: {} })).resolves.toBeDefined();
  });

  it("rejects a response that belongs to a different request", async () => {
    const { backend } = createBackend(() => ({ "x-correlation-id": "some-older-request" }));

    await expect(backend.submit({ session, data: {} })).rejects.toBeInstanceOf(StaleResponseError);
  });
});

describe("getEchoedCorrelationId", () => {
  it("prefers the response header over the body", () => {
    const res = { headers: { "x-correlation-id": "from-header" }, data: { correlationId: "from-body" } };
    expect(getEchoedCorrelationId(res)).toBe("from-header");
  });
});
