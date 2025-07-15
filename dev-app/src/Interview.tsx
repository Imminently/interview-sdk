import { ApiManager, AttributeValues, AuthConfig, ManagerOptions, Session, Simulate } from "@imminently/interview-sdk";
import { Interview } from "@imminently/interview-ui";

// place token here for testing
const user = {}

export const API = {
  baseUrl: "https://api.dev.decisively.imminently.co",
  tenancy: "32b1f94f-ef39-4b8b-a49f-8b6f5f72fd8d",
  /** main brii project */
  // model: "af7715f3-9242-4646-a614-0932b598c5c8",
  // interview: "Award selection interview (embeds rate determination)",
  // dev control test
  model: "42d3e876-af7d-4579-b17f-514ee08487b8",
  interview: "Control test",
}

class CustomApi extends ApiManager {
  simulate = async (session: Session, data: Partial<Simulate>) => {
    // Dynamic interactions are now on a post (due to new interaction behaviour in backend)
    const res = await this.api.post<AttributeValues>(
      buildUrl(session.sessionId, "interview"),
      {
        mode: "api",
        save: false,
        ...data,
      }
    );
    return res.data;
  }

  getRulesEngineUrl = (checksum?: string) => {
    return `${this.options.host}/rules-engine?=${checksum}`;
  }
}

export const getInterviewConfig = (interview?: string) => {
  return {
    debug: true,
    sessionConfig: {
      project: API.model,
      // release: "interview",
      interview: interview ?? API.interview,
    },
    apiManager: new CustomApi({
      host: API.baseUrl,
      // path: "timesheet",
      auth: () => ({
        token: `Bearer ${user.id_token as string}`,
        tenancy: API.tenancy,
      }),
    }),
    fileManager: {
      host: API.baseUrl,
    },
  } as ManagerOptions;
}

export const InterviewPage = () => {
  const options = getInterviewConfig()
  return (
    <Interview options={options} />
  )
}

function buildUrl(model: string, release: string): string {
  throw new Error("Function not implemented.");
}
