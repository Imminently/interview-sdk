import { type ManagerOptions, buildUrl } from "@imminently/interview-sdk";
import { deciEnv } from "../config/env";

/**
 * Builds the `ManagerOptions` for a single interview run. Host / token / tenancy
 * come from `deciEnv` (dev-app/.env); the caller only picks which project and
 * interview to start.
 */
export const getInterviewConfig = (params: {
  project: string;
  interview: string;
}): ManagerOptions => {
  const { project, interview } = params;
  const baseUrl = deciEnv.apiHost;

  return {
    debug: true,
    preCacheClient: true,
    init: (manager) => {
      console.log("Interview initialized");
      manager.create({ project, interview });
    },
    apiManager: {
      host: baseUrl,
      auth: () => ({
        token: `Bearer ${deciEnv.token}`,
        tenancy: deciEnv.tenancy,
      }),
      apiGetters: {
        simulate: ({ session }) => buildUrl(session.sessionId, "interview"),
        // @ts-ignore - getRulesEngine is not in the public apiGetters type
        getRulesEngine: ({ checksum }) =>
          `${baseUrl}/decisionapi/rules-engine-script?checksum=${checksum}`,
        // TODO: connected-data host is hardcoded to edward dev; make configurable if needed.
        getConnectedData: () => `https://api.dev.edward.imminently.co/meta/custom/connection`,
      },
    },
    fileManager: {
      host: baseUrl,
    },
  } as ManagerOptions;
};
