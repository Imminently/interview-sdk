import { useInterview } from "@/interview/InterviewContext";

export const SessionDataTab = () => {
  const { session } = useInterview();

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-gray-500">Session data</h3>
      <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 overflow-auto">
        <code>{JSON.stringify(session?.data ?? null, null, 2)}</code>
      </pre>
    </div>
  );
};
