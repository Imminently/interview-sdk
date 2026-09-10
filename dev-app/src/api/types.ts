/** Shapes returned by the Decisively platform `/workspaces/` and `/models/`
 *  routes. Only the fields the dev-app reads are typed; the rest pass through. */

export interface Workspace {
  id: string;
  name?: string;
  displayName?: string;
  title?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name?: string;
  displayName?: string;
  title?: string;
  workspace?: string;
  [key: string]: unknown;
}

export interface InterviewSummary {
  id: string;
  name: string;
  goal?: string;
}

export interface Release {
  id: string;
  releaseNo?: number;
  env?: string;
  description?: string;
  workspace?: string;
  /** Present only when `interviews` is asked for in `$fields`. */
  interviews?: InterviewSummary[];
  [key: string]: unknown;
}

/** Best display label for a workspace/project record. */
export const labelOf = (record: Workspace | Project): string =>
  record.name || record.displayName || record.title || record.id;
