import { useInterview } from "@/interview/InterviewContext";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <>
    <dt className="text-gray-500 flex items-center">{label}</dt>
    <dd className="font-mono text-xs break-all flex items-center">{value ?? <span className="text-gray-400 italic">—</span>}</dd>
  </>
);

export const SessionTab = () => {
  const { session } = useInterview();

  if (!session) {
    return (
      <div className="p-4 text-sm text-gray-500 italic">No active session.</div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      <section>
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-500">Session</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <Row label="Session" value={session.sessionId} />
          <Row label="Interaction" value={session.interactionId} />
          <Row label="Model" value={session.model} />
          <Row label="Release" value={session.release} />
          {/* @ts-ignore */}
          <Row label="Number" value={session.releaseNo ?? "N/A"} />
          <Row label="Goal" value={session.goal} />
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-500">Screen</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <Row label="Title" value={session.screen?.title} />
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-500">Context</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <Row label="Entity" value={session.context?.entity} />
          {session.context?.id !== undefined && <Row label="ID" value={session.context.id} />}
          {session.context?.parent !== undefined && <Row label="Parent" value={session.context.parent} />}
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-500">Progress</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          <Row label="Percentage" value={session.progress?.percentage} />
          <Row label="ETA (s)" value={session.progress?.time} />
        </dl>
      </section>
    </div>
  );
};
