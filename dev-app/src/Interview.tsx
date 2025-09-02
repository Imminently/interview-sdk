import { type ManagerOptions, buildUrl } from "@imminently/interview-sdk";
import { Interview } from "@imminently/interview-ui";

// place token here for testing
const user = {};

export const API = {
  baseUrl: "https://api.dev.decisively.imminently.co",
  tenancy: "32b1f94f-ef39-4b8b-a49f-8b6f5f72fd8d",
  /** main brii project */
  // model: "af7715f3-9242-4646-a614-0932b598c5c8",
  // interview: "Award selection interview (embeds rate determination)",
  // dev control test
  model: "42d3e876-af7d-4579-b17f-514ee08487b8",
  interview: "Control test",
};


export const getInterviewConfig = (interview?: string) => {
  return {
    debug: true,
    sessionConfig: {
      project: API.model,
      // release: "interview",
      interview: interview ?? API.interview,
    },
    apiManager: {
      host: API.baseUrl,
      auth: () => ({
        token: `Bearer ${user.id_token as string}`,
        tenancy: API.tenancy,
      }),
      apiGetters: {
        simulate: ({ session }) => buildUrl(session.sessionId, "interview"),
        getRulesEngine: (checksum?: string) =>
          `${API.baseUrl}/rules-engine?=${checksum}`,
      },
    },
    fileManager: {
      host: API.baseUrl,
    },
  } as ManagerOptions;
};

export const InterviewPage = () => {
  const options = getInterviewConfig();
  return <Interview options={options} />;
};
