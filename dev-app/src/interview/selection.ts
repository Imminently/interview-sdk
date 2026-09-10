/**
 * The current interview selection lives in the URL query string so a reload
 * keeps you in the running interview and the link is shareable:
 *   ?model=<projectId>&interview=<name>
 *
 * The release is not part of the selection: the runtime always resolves the
 * project's latest release.
 */

export interface Selection {
  model: string;
  interview: string;
}

export const readSelection = (): Selection | null => {
  const params = new URLSearchParams(window.location.search);
  const model = params.get("model");
  const interview = params.get("interview");
  if (!model || !interview) return null;
  return { model, interview };
};

/** Write the selection to the URL and reload into the runner. */
export const launchSelection = (selection: Selection): void => {
  const url = new URL(window.location.href);
  url.searchParams.set("model", selection.model);
  url.searchParams.set("interview", selection.interview);
  window.location.href = url.toString();
};

/** Remove the selection params (used to return to the picker). */
export const clearSelection = (): void => {
  const url = new URL(window.location.href);
  for (const key of ["model", "interview", "release"]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState(null, "", url.toString());
};
