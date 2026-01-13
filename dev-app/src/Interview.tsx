import { type ManagerOptions, buildUrl } from "@imminently/interview-sdk";
import { Interview, useInterview } from "@imminently/interview-ui";

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

export const getInterviewConfig = (token: string, interview?: string) => {
  return {
    debug: true,
    preCacheClient: true,
    init: (manager) => {
      console.log("Interview initialized");
      manager.create({
        project: API.model,
        interview: interview ?? API.interview,
      })
    },
    apiManager: {
      host: API.baseUrl,
      auth: () => ({
        token: `Bearer ${token as string}`,
        tenancy: API.tenancy,
      }),
      apiGetters: {
        simulate: ({ session }) => buildUrl(session.sessionId, "interview"),
        // @ts-ignore
        getRulesEngine: ({ checksum }) =>
          `${API.baseUrl}/decisionapi/rules-engine-script?checksum=${checksum}`,
        getConnectedData: () => `https://api.dev.edward.imminently.co/meta/custom/connection`,
      },
    },
    fileManager: {
      host: API.baseUrl,
    },
  } as ManagerOptions;
};

const InterviewError = () => {
  const { error } = useInterview();
  const status = (error as any)?.status;
  if (status === 401 || status === 403) {
    // remove token from url and reload
    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    window.location.href = url.toString();
    return null;
  }
  return <Interview.Error />;
}

export const InterviewPage = () => {
  // get user token from url params, e.g. ?token=...
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    // render token input, then redirect with token in url
    return (
      <div style={{ padding: 20 }}>
        <h2>Enter your access token</h2>
        <input
          type="text"
          id="tokenInput"
          placeholder="Access Token"
          style={{ width: "300px", padding: "10px", fontSize: "16px" }}
        />
        <button
          style={{ marginLeft: "10px", padding: "10px 20px", fontSize: "16px" }}
          onClick={() => {
            const input = document.getElementById("tokenInput") as HTMLInputElement;
            const tokenValue = input.value.trim();
            if (tokenValue) {
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set("token", tokenValue);
              window.location.href = newUrl.toString();
            } else {
              alert("Please enter a valid token.");
            }
          }}
        >
          Submit
        </button>
      </div>
    )
  }

  const options = getInterviewConfig(token);
  return (
    <Interview options={options} inlineErrors>
      <InterviewError />
      <Interview.Loading />
      <Interview.Content />
      <div className="fixed top-4 left-4 z-50 max-w-[300px] bg-card shadow-lg border rounded-xl overflow-auto">
        <Interview.Debug />
      </div>
    </Interview>
  );
};
