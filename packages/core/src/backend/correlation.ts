import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { uuid } from "../util";

/** Request/response header the decisionapi reads and echoes back. */
export const CORRELATION_HEADER = "X-Correlation-Id";
/** Query param carrying the same id, so every session request has a unique URL and can never match a cached response. */
export const CORRELATION_PARAM = "correlationId";

/** Thrown when a response carries a different correlation id to the request that produced it. */
export class StaleResponseError extends Error {
  constructor(
    readonly sent: string,
    readonly received: string,
  ) {
    super(`Received a response for request ${received} while waiting on ${sent}`);
    this.name = "StaleResponseError";
  }
}

/** Creates a new correlation id for a session request. */
export const createCorrelationId = (): string => uuid();

/**
 * Adds the correlation id to a request config as both the `X-Correlation-Id` header and a `correlationId` query param.
 */
export const withCorrelation = (correlationId: string, config: AxiosRequestConfig = {}): AxiosRequestConfig => ({
  ...config,
  headers: { ...(config.headers as Record<string, string> | undefined), [CORRELATION_HEADER]: correlationId },
  params: { ...config.params, [CORRELATION_PARAM]: correlationId },
});

/**
 * Reads the id the server echoed back, preferring the response header and falling back to the body field.
 */
export const getEchoedCorrelationId = (res: Pick<AxiosResponse, "headers" | "data">): string | undefined => {
  const header = res.headers?.[CORRELATION_HEADER.toLowerCase()];
  if (typeof header === "string" && header) return header;
  const body = res.data?.[CORRELATION_PARAM];
  return typeof body === "string" && body ? body : undefined;
};

/**
 * Throws a {@link StaleResponseError} when the server echoed a different id to the one sent. A missing echo is
 * accepted so older backends that don't echo the id keep working.
 */
export const assertCorrelated = (correlationId: string, res: Pick<AxiosResponse, "headers" | "data">): void => {
  const echoed = getEchoedCorrelationId(res);
  if (echoed && echoed !== correlationId) {
    throw new StaleResponseError(correlationId, echoed);
  }
};
