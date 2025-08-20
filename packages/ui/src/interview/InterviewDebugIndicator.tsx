import { useDebugSettings } from "@/providers";

const InterviewDebugIndicator = () => {
  const { debugEnabled } = useDebugSettings();
  if (!debugEnabled) {
    return null;
  }

  return <div className="absolute flex flex-col gap-2 top-2 right-2 rounded bg-black/80 text-white p-2">
    <div>Debug mode enabled</div>
    <ul className={"text-sm list-inside"}>
      <li>Ctrl + Click a control to open the debug dialog</li>
      <li>Turn off with Cmd+D or Ctrl+D</li>
      <li>Press ` to enable switch container debug</li>
    </ul>
  </div>;
};

export default InterviewDebugIndicator;
