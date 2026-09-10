import { apiFetch, normalizeList } from "./client";
import type { InterviewSummary, Project, Release, Workspace } from "./types";

/**
 * Direct Decisively platform routes (not EdWard's `meta/custom/*` proxy, which
 * routes the same data through EdWard's own backend).
 *
 * Tenancy is carried only by the `X-TENANCY` header (see api/client.ts) — never
 * a query param. Every path keeps its trailing slash.
 *
 *   GET /workspaces/?name=<term>            -> workspaces (server-side name search)
 *   GET /models/?workspace=<id>&name=<term> -> projects (a.k.a. models) in a workspace
 *   GET /releases/?model=<id>&activeVersionFlag=true&env=test&$fields=...,interviews
 *                              -> the project's current test release, with its
 *                                 interviews inlined in the payload
 *
 * The combobox search term goes through as the `name` filter, wrapped in `*`
 * wildcards for a contains match — matching the portal's `useSearch`
 * (apps/portal/src/components/Search.tsx: `defaultTransform = v => `*${v.trim()}*``)
 * feeding `ImmiCombobox` (`filter: { name: sFilter || undefined, ...filter }`),
 * used by `WorkspaceSelector` / `ProjectSelector`. Interviews are NOT a listable
 * resource of their own: they live on a release (portal `useCurrentReleases` +
 * `SelectInterview`, which reads `currentReleases[0].interviews`). immi-query
 * serialises `fields: [...]` to `$fields=a,b` and `pagination` to `$limit`/`$skip`.
 */

const PAGE = 25;

/** `*term*` wildcard wrap, or undefined for an empty search (portal convention). */
const nameFilter = (search?: string): string | undefined => {
  const term = search?.trim();
  return term ? `*${term}*` : undefined;
};

export const listWorkspaces = async (search?: string): Promise<Workspace[]> =>
  normalizeList<Workspace>(
    await apiFetch("/workspaces/", { name: nameFilter(search), $limit: PAGE }),
  );

export const listProjects = async (
  workspaceId: string,
  search?: string,
): Promise<Project[]> => {
  const raw = await apiFetch("/models/", {
    workspace: workspaceId || undefined,
    name: nameFilter(search),
    $limit: PAGE,
  });
  const projects = normalizeList<Project>(raw);
  // Filter client-side as well, in case the service ignores the workspace filter.
  return workspaceId
    ? projects.filter((p) => !p.workspace || p.workspace === workspaceId)
    : projects;
};

/** The project's current (active) release for the test environment, if any. */
export const getCurrentTestRelease = async (
  projectId: string,
): Promise<Release | undefined> => {
  const raw = await apiFetch("/releases/", {
    model: projectId,
    activeVersionFlag: true,
    env: "test",
    $limit: 1,
    $fields: "id,releaseNo,env,interviews",
  });
  return normalizeList<Release>(raw)[0];
};

export const listInterviews = async (projectId: string): Promise<InterviewSummary[]> => {
  const release = await getCurrentTestRelease(projectId);
  return release?.interviews ?? [];
};
