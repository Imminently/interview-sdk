import { useDebugSettings } from "@/providers";
import { useInterview } from "./InterviewContext";
import { Computer, Server } from "lucide-react";

const InterviewDebugIndicator = () => {
  const { debugEnabled } = useDebugSettings();
  const { manager } = useInterview();

  if (!debugEnabled) {
    return null;
  }

  // get the current snapshot
  const snapshot = manager.getSnapshot();

  const isClientDynamic = Boolean(manager.clientGraph);

  return (
    <div className="absolute backdrop-blur-sm flex flex-col gap-2 top-2 right-2 rounded bg-black/80 text-white p-2 z-100">
      <div>Debug mode enabled</div>
      <ul className={"text-sm list-inside"}>
        <li>Shift + Click a control to open the debug dialog</li>
        <li>Turn off with Cmd+D or Ctrl+D</li>
        <li>Press ` to enable switch container debug</li>
      </ul>
      <div>Snapshot</div>
      <dl className={"text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5"}>
        <dt className="text-white/60">isLoading</dt>
        <dd>{snapshot.loading.toString()}</dd>
        <dt className="text-white/60">state</dt>
        <dd>{snapshot.state}</dd>
        <dt className="text-white/60">renderAt</dt>
        <dd>{snapshot.renderAt}</dd>
      </dl>
      <div className="text-sm text-white/60 col-span-2 flex flex-row gap-1 items-center">
        {isClientDynamic ? <Computer size={16} /> : <Server size={16} />}
        {isClientDynamic ? "Client Side Dynamic" : "Server Side Dynamic"}
      </div>
    </div>
  );
};

export default InterviewDebugIndicator;
