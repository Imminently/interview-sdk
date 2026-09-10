import { Interview, useInterview } from "@imminently/interview-ui";
import { clearSelection } from "./selection";

/**
 * On an auth failure (401/403) the token in `.env` is bad or expired: drop the
 * project/interview selection from the URL and reload back to the picker.
 * Anything else falls through to the SDK's own error UI.
 */
export const InterviewError = () => {
  const { error } = useInterview();
  const status = (error as { status?: number } | undefined)?.status;

  if (status === 401 || status === 403) {
    clearSelection();
    window.location.reload();
    return null;
  }

  return <Interview.Error />;
};
