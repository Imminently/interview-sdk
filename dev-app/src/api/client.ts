import { deciEnv } from "../config/env";

/**
 * Thin fetch wrapper for the Decisively platform API: base URL from env,
 * `Authorization: Bearer` + `X-TENANCY` headers, JSON out, throw on non-2xx.
 * Tenancy is header-only — never a query param.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(body || `Request failed with status ${status}`);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | boolean | undefined | null;

const buildUrl = (path: string, query?: Record<string, QueryValue>) => {
  const base = deciEnv.apiHost.replace(/\/$/, "");
  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(`${base}/${normalizedPath}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
};

export const apiFetch = async <T = unknown>(
  path: string,
  query?: Record<string, QueryValue>,
): Promise<T> => {
  const res = await fetch(buildUrl(path, query), {
    headers: {
      Authorization: `Bearer ${deciEnv.token}`,
      "X-TENANCY": deciEnv.tenancy,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
};

/** Accepts either a bare array or an `{ data, total }` envelope. */
export const normalizeList = <T>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  const data = (raw as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as T[]) : [];
};
