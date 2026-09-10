import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { listInterviews, listProjects, listWorkspaces } from "../api/platform";
import { labelOf } from "../api/types";
import type { InterviewSummary } from "../api/types";
import { deciEnv } from "../config/env";
import { launchSelection } from "./selection";

const field: React.CSSProperties = { marginBottom: 16 };
const label: React.CSSProperties = { display: "block", marginBottom: 4, fontWeight: 600 };
const input: React.CSSProperties = { padding: 8, fontSize: 15, width: "100%", boxSizing: "border-box" };
const hint: React.CSSProperties = { fontSize: 13, color: "#666", marginTop: 4 };
const errorStyle: React.CSSProperties = { fontSize: 13, color: "#b00020", marginTop: 4 };

const errMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Trailing-call debounce for the async combobox `loadOptions(input, callback)`. */
const debounce = <A extends unknown[]>(fn: (...args: A) => void, ms: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

const SEARCH_DEBOUNCE_MS = 250;

type Opt = { value: string; label: string };

/** Keep the dropdown above anything and avoid clipping inside the card. */
const comboStyles = {
  menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
};

const findOpt = (options: Opt[], value: string): Opt | null =>
  options.find((o) => o.value === value) ?? null;

const launchButton = (disabled: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: 10,
  fontSize: 15,
  fontWeight: 600,
  color: disabled ? "#9ca3af" : "#5b3df5",
  background: "transparent",
  border: `1px solid ${disabled ? "#d1d5db" : "#5b3df5"}`,
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
});

const hostLabel = (raw: string) => {
  try {
    return new URL(raw).host;
  } catch {
    return raw || "(no VITE_DECI_API_HOST set)";
  }
};

const BrowseTab = () => {
  // Workspace and project are searched server-side, so we hold the whole picked
  // option (value + label) rather than just an id.
  const [workspace, setWorkspace] = useState<Opt | null>(null);
  const [workspacesError, setWorkspacesError] = useState<string | null>(null);

  const [project, setProject] = useState<Opt | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [interviewName, setInterviewName] = useState("");
  const [interviewsError, setInterviewsError] = useState<string | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState(false);

  const workspaceId = workspace?.value ?? "";
  const projectId = project?.value ?? "";

  const loadWorkspaces = useMemo(
    () =>
      debounce((inputValue: string, cb: (opts: Opt[]) => void) => {
        setWorkspacesError(null);
        listWorkspaces(inputValue)
          .then((rows) => cb(rows.map((w) => ({ value: w.id, label: labelOf(w) }))))
          .catch((e) => {
            setWorkspacesError(errMessage(e));
            cb([]);
          });
      }, SEARCH_DEBOUNCE_MS),
    [],
  );

  const loadProjects = useMemo(
    () =>
      debounce((inputValue: string, cb: (opts: Opt[]) => void) => {
        if (!workspaceId) {
          cb([]);
          return;
        }
        setProjectsError(null);
        listProjects(workspaceId, inputValue)
          .then((rows) => cb(rows.map((p) => ({ value: p.id, label: labelOf(p) }))))
          .catch((e) => {
            setProjectsError(errMessage(e));
            cb([]);
          });
      }, SEARCH_DEBOUNCE_MS),
    [workspaceId],
  );

  useEffect(() => {
    setInterviews([]);
    setInterviewName("");
    setInterviewsError(null);
    if (!projectId) return;
    let cancelled = false;
    setLoadingInterviews(true);
    listInterviews(projectId)
      .then((data) => {
        if (cancelled) return;
        setInterviews(data);
        if (data.length === 1) setInterviewName(data[0].name);
      })
      .catch((e) => !cancelled && setInterviewsError(errMessage(e)))
      .finally(() => !cancelled && setLoadingInterviews(false));
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const canLaunch = Boolean(projectId && interviewName);

  const interviewOptions: Opt[] = interviews.map((i) => ({ value: i.name, label: i.name }));

  return (
    <div>
      <div style={field}>
        <label style={label}>Workspace</label>
        <AsyncSelect<Opt>
          cacheOptions
          defaultOptions
          loadOptions={loadWorkspaces}
          value={workspace}
          onChange={(opt) => {
            setWorkspace(opt ?? null);
            setProject(null);
          }}
          isClearable
          placeholder="Search workspaces…"
          menuPortalTarget={document.body}
          styles={comboStyles}
        />
        {workspacesError && <div style={errorStyle}>{workspacesError}</div>}
      </div>

      <div style={field}>
        <label style={label}>Project</label>
        <AsyncSelect<Opt>
          key={workspaceId || "no-workspace"}
          cacheOptions
          defaultOptions
          loadOptions={loadProjects}
          value={project}
          onChange={(opt) => setProject(opt ?? null)}
          isDisabled={!workspaceId}
          isClearable
          placeholder={workspaceId ? "Search projects…" : "Pick a workspace first"}
          menuPortalTarget={document.body}
          styles={comboStyles}
        />
        {projectsError && <div style={errorStyle}>{projectsError}</div>}
      </div>

      <div style={field}>
        <label style={label}>Interview</label>
        <Select<Opt>
          options={interviewOptions}
          value={findOpt(interviewOptions, interviewName)}
          onChange={(opt) => setInterviewName(opt?.value ?? "")}
          isLoading={loadingInterviews}
          isDisabled={!projectId || loadingInterviews || interviews.length === 0}
          isClearable
          placeholder={
            loadingInterviews
              ? "Loading…"
              : projectId
                ? interviews.length === 0
                  ? "No interviews on the current test release"
                  : "Search interviews…"
                : "Pick a project first"
          }
          menuPortalTarget={document.body}
          styles={comboStyles}
        />
        {interviewsError && <div style={errorStyle}>{interviewsError}</div>}
        <div style={hint}>Interviews come from the project's current test release.</div>
      </div>

      <button
        style={launchButton(!canLaunch)}
        disabled={!canLaunch}
        onClick={() => launchSelection({ model: projectId, interview: interviewName })}
      >
        <span aria-hidden>🚀</span> Launch interview
      </button>
    </div>
  );
};

const ManualTab = () => {
  const [projectId, setProjectId] = useState("");
  const [interviewName, setInterviewName] = useState("");
  const canLaunch = Boolean(projectId.trim() && interviewName.trim());

  return (
    <div>
      <div style={field}>
        <label style={label}>Project (model) id</label>
        <input
          style={input}
          value={projectId}
          placeholder="e.g. 42d3e876-af7d-4579-b17f-514ee08487b8"
          onChange={(e) => setProjectId(e.target.value)}
        />
      </div>
      <div style={field}>
        <label style={label}>Interview name</label>
        <input
          style={input}
          value={interviewName}
          placeholder="e.g. Control test"
          onChange={(e) => setInterviewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canLaunch) {
              launchSelection({
                model: projectId.trim(),
                interview: interviewName.trim(),
              });
            }
          }}
        />
      </div>
      <button
        style={launchButton(!canLaunch)}
        disabled={!canLaunch}
        onClick={() =>
          launchSelection({
            model: projectId.trim(),
            interview: interviewName.trim(),
          })
        }
      >
        <span aria-hidden>🚀</span> Launch interview
      </button>
    </div>
  );
};

type Tab = "browse" | "manual";

const tabButton = (active: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: active ? 700 : 400,
  border: "none",
  borderBottom: active ? "2px solid #5b3df5" : "2px solid transparent",
  background: "none",
  cursor: "pointer",
});

export const InterviewPicker = () => {
  const [tab, setTab] = useState<Tab>("browse");

  return (
    <div style={{ padding: 24, maxWidth: 520, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: 4 }}>Start an interview</h2>
      <div style={{ ...hint, marginBottom: 16 }}>{hostLabel(deciEnv.apiHost)}</div>

      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #ddd", marginBottom: 20 }}>
        <button style={tabButton(tab === "browse")} onClick={() => setTab("browse")}>
          Browse
        </button>
        <button style={tabButton(tab === "manual")} onClick={() => setTab("manual")}>
          Manual
        </button>
      </div>

      {tab === "browse" ? <BrowseTab /> : <ManualTab />}
    </div>
  );
};
