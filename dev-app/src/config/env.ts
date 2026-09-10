/**
 * Reads the `VITE_DECI_*` values from `dev-app/.env` (see dev-app/README.md).
 * These supply the API host, bearer token and tenancy used for every meta and
 * interview call. Nothing here throws: `InterviewPage` renders `EnvMissingNotice`
 * when `missingDeciEnvKeys` is non-empty.
 */

const read = (value: string | undefined) => (value ?? "").trim();

export const deciEnv = {
  apiHost: read(import.meta.env.VITE_DECI_API_HOST),
  token: read(import.meta.env.VITE_DECI_API_TOKEN),
  tenancy: read(import.meta.env.VITE_DECI_API_TENANCY),
};

const REQUIRED = {
  VITE_DECI_API_HOST: deciEnv.apiHost,
  VITE_DECI_API_TOKEN: deciEnv.token,
  VITE_DECI_API_TENANCY: deciEnv.tenancy,
} as const;

export const missingDeciEnvKeys = Object.entries(REQUIRED)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const hasDeciEnv = missingDeciEnvKeys.length === 0;
