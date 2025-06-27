import { useState } from "react";
import { ManagerOptions, SessionManager } from "@imminently/interview-sdk";
import { Interview } from "@imminently/interview-ui";

// place token here for testing
const user = {};

export const API = {
  baseUrl: "https://api.dev.decisively.imminently.co",
  tenancy: "32b1f94f-ef39-4b8b-a49f-8b6f5f72fd8d",
  /** aka project */
  model: "b2063cf7-ac77-44d8-a2c8-522fa6eadefb",
  release: "a934e45c-e91a-4f47-ac6a-ba74309c7467",
  interview: "91a84a89-5e48-4158-a5d7-bc622cfe34cd",
  // goal: "27c114ac-337e-4dbc-8c53-457588397cfb"
}

export const getInterviewConfig = (interview?: string) => {
  const token = user.id_token as string;
  return {
    debug: true,
    host: API.baseUrl,
    tenancyId: API.tenancy,
    apiToken: token,
    // api: API,
    sessionConfig: {
      project: API.model,
      interview: interview ?? API.interview,
      // release: "0eea8a84-436d-4c8e-8745-14f345726f41",
      release: API.release,
      // sessionId: sessionId ?? undefined,
    },
    fileManager: {
      host: API.baseUrl,
    },
    overrides: {
      transformRequest: [
        (data, headers) => {
          if (headers) {
            const tenancy = API.tenancy;

            headers.Authorization = token
              ? `Bearer ${token}`
              : undefined;
            headers["X-TENANCY"] = tenancy;
          }

          return JSON.stringify(data);
        },
      ],
    },
  } as ManagerOptions;
}

export const InterviewPage = () => {
  const options = getInterviewConfig()
  // const [sessionManager] = useState(() => new SessionManager(options as ManagerOptions));
  return (
    <div>
      <h1>Interview</h1>
      <Interview options={options} />
    </div>
  )
}