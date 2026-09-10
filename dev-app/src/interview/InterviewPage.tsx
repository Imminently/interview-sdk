import { hasDeciEnv } from "../config/env";
import { EnvMissingNotice } from "./EnvMissingNotice";
import { InterviewPicker } from "./InterviewPicker";
import { InterviewRunner } from "./InterviewRunner";
import { readSelection } from "./selection";

/**
 * Entry screen. Decides between:
 *  - env not configured -> EnvMissingNotice
 *  - no selection in the URL -> InterviewPicker (browse or manual)
 *  - ?model=&interview= present -> InterviewRunner
 */
export const InterviewPage = () => {
  if (!hasDeciEnv) return <EnvMissingNotice />;

  const selection = readSelection();
  if (!selection) return <InterviewPicker />;

  return <InterviewRunner project={selection.model} interview={selection.interview} />;
};
