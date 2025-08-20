import { useDebugSettings } from "@/providers";

const InterviewDebugIndicator = () => {
  const { debugEnabled } = useDebugSettings();
  if (!debugEnabled) {
    return null;
  }

  return <div className="absolute top-0 right-0 bg-red-500 text-white p-2">Debug</div>;
};

export default InterviewDebugIndicator;
