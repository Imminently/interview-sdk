import { type ManagerOptions, buildUrl } from "@imminently/interview-sdk";
import { Interview, SidebarInset, SidebarProvider, useInterview } from "@imminently/interview-ui";
import { useState } from "react";

const ENVIRONMENTS = [
  {
    label: "Dev",
    url: "https://api.dev.decisively.imminently.co",
    tenancies: [
      {
        label: "Acme",
        id: "32b1f94f-ef39-4b8b-a49f-8b6f5f72fd8d",
        models: [
          {
            label: "Control test",
            id: "42d3e876-af7d-4579-b17f-514ee08487b8",
            interviews: ["Control test"],
          },
          {
            label: "Main Brii project",
            id: "af7715f3-9242-4646-a614-0932b598c5c8",
            interviews: ["Award selection interview (embeds rate determination)"],
          },
          {
            label: "Modern Age Pension",
            id: "8ee9a418-dfe3-4075-8920-b2d0f4bea399",
            interviews: ["Modern Age Pension New Intake"],
          },
        ],
      },
    ],
  },
];

export const getInterviewConfig = (params: {
  token: string;
  baseUrl: string;
  tenancy: string;
  model: string;
  interview: string;
}) => {
  const { token, baseUrl, tenancy, model, interview } = params;
  return {
    debug: true,
    preCacheClient: true,
    init: (manager) => {
      console.log("Interview initialized");
      manager.create({ project: model, interview });
    },
    apiManager: {
      host: baseUrl,
      auth: () => ({
        token: `Bearer ${token}`,
        tenancy,
      }),
      apiGetters: {
        simulate: ({ session }) => buildUrl(session.sessionId, "interview"),
        // @ts-ignore
        getRulesEngine: ({ checksum }) =>
          `${baseUrl}/decisionapi/rules-engine-script?checksum=${checksum}`,
        getConnectedData: () => `https://api.dev.edward.imminently.co/meta/custom/connection`,
      },
    },
    fileManager: {
      host: baseUrl,
    },
  } as ManagerOptions;
};

const selectStyle: React.CSSProperties = { padding: "8px", fontSize: "16px", minWidth: "220px" };
const labelStyle: React.CSSProperties = { display: "block", marginBottom: "4px", fontWeight: "bold" };
const fieldStyle: React.CSSProperties = { marginBottom: "16px" };

const AccessTokenScreen = () => {
  const defaultEnv = ENVIRONMENTS[0];
  const defaultTenancy = defaultEnv.tenancies[0];
  const defaultModel = defaultTenancy.models[0];

  const [selectedUrl, setSelectedUrl] = useState(defaultEnv.url);
  const [selectedTenancyId, setSelectedTenancyId] = useState(defaultTenancy.id);
  const [selectedModelId, setSelectedModelId] = useState(defaultModel.id);
  const [selectedInterview, setSelectedInterview] = useState(defaultModel.interviews[0]);
  const [token, setToken] = useState("");

  const currentEnv = ENVIRONMENTS.find(e => e.url === selectedUrl) ?? defaultEnv;
  const currentTenancy = currentEnv.tenancies.find(t => t.id === selectedTenancyId) ?? currentEnv.tenancies[0];
  const currentModel = currentTenancy.models.find(m => m.id === selectedModelId) ?? currentTenancy.models[0];

  const handleUrlChange = (url: string) => {
    setSelectedUrl(url);
    const env = ENVIRONMENTS.find(e => e.url === url) ?? ENVIRONMENTS[0];
    const tenancy = env.tenancies[0];
    setSelectedTenancyId(tenancy.id);
    const model = tenancy.models[0];
    setSelectedModelId(model.id);
    setSelectedInterview(model.interviews[0]);
  };

  const handleTenancyChange = (id: string) => {
    setSelectedTenancyId(id);
    const tenancy = currentEnv.tenancies.find(t => t.id === id) ?? currentEnv.tenancies[0];
    const model = tenancy.models[0];
    setSelectedModelId(model.id);
    setSelectedInterview(model.interviews[0]);
  };

  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    const model = currentTenancy.models.find(m => m.id === id) ?? currentTenancy.models[0];
    setSelectedInterview(model.interviews[0]);
  };

  const handleSubmit = () => {
    if (!token.trim()) {
      alert("Please enter a valid token.");
      return;
    }
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("token", token.trim());
    newUrl.searchParams.set("baseUrl", selectedUrl);
    newUrl.searchParams.set("tenancy", selectedTenancyId);
    newUrl.searchParams.set("model", selectedModelId);
    newUrl.searchParams.set("interview", selectedInterview);
    window.location.href = newUrl.toString();
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h2>Enter your access token</h2>

      <div style={fieldStyle}>
        <label style={labelStyle}>Environment</label>
        <select value={selectedUrl} onChange={e => handleUrlChange(e.target.value)} style={selectStyle}>
          {ENVIRONMENTS.map(env => (
            <option key={env.url} value={env.url}>{env.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Tenancy</label>
        <select value={selectedTenancyId} onChange={e => handleTenancyChange(e.target.value)} style={selectStyle}>
          {currentEnv.tenancies.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Model</label>
        <select value={selectedModelId} onChange={e => handleModelChange(e.target.value)} style={selectStyle}>
          {currentTenancy.models.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Interview</label>
        <select value={selectedInterview} onChange={e => setSelectedInterview(e.target.value)} style={selectStyle}>
          {currentModel.interviews.map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Access Token</label>
        <input
          type="text"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Access Token"
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ padding: "8px", fontSize: "16px", width: "100%", boxSizing: "border-box" }}
        />
      </div>

      <button
        style={{ padding: "10px 20px", fontSize: "16px" }}
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );
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
};

const NavHeader = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const { state } = useInterview();
  const interview = urlParams.get("interview");

  if(state !== "success") return;

  // render breadcrum of our options
  return (
    <div className="px-4 py-2 border-b border-gray-200 text-sm text-gray-500">
      <a href="/">Home</a>
      <span className="mx-2">/</span>
      <span className="text-foreground font-semibold">{interview}</span>
    </div>
  );
}

export const InterviewPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const baseUrl = urlParams.get("baseUrl");
  const tenancy = urlParams.get("tenancy");
  const model = urlParams.get("model");
  const interview = urlParams.get("interview");

  if (!token || !baseUrl || !tenancy || !model || !interview) {
    return <AccessTokenScreen />;
  }

  const options = getInterviewConfig({ token, baseUrl, tenancy, model, interview });
  return (
    <Interview options={options} inlineErrors>
      <InterviewError />
      <Interview.Loading />
      <SidebarProvider>
        <Interview.Steps showSubSteps />
        <SidebarInset>
          <NavHeader />
          <Interview.Content />
        </SidebarInset>
      </SidebarProvider>
    </Interview>
  );
};
