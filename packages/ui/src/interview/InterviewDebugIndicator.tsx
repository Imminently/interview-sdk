import { useDebugSettings } from "@/providers";
import { useInterview } from "./InterviewContext";

const InterviewDebugIndicator = () => {
  const { debugEnabled } = useDebugSettings();
  const { manager } = useInterview();

  if (!debugEnabled) {
    return null;
  }

  // get the current snapshot
  const snapshot = manager.getSnapshot();

  return (
    <div className="absolute backdrop-blur-sm flex flex-col gap-2 top-2 right-2 rounded bg-black/80 text-white p-2 z-100">
      <div>Debug mode enabled</div>
      <ul className={"text-sm list-inside"}>
        <li>Shift + Click a control to open the debug dialog</li>
        <li>Turn off with Cmd+D or Ctrl+D</li>
        <li>Press ` to enable switch container debug</li>
      </ul>
      <div>Snapshot</div>
      <ul className={"text-sm list-inside"}>
        <li>isLoading: {snapshot.loading.toString()}</li>
        <li>state: {snapshot.state}</li>
        <li>renderAt: {snapshot.renderAt}</li>
      </ul>
    </div>
  );
};

export default InterviewDebugIndicator;
