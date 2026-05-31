import { useInterview } from "@/interview/InterviewContext";
import type { Validation } from "@imminently/interview-sdk";

const StatusBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
      active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
    }`}
  >
    {label}
  </span>
);

const SeverityBadge = ({ severity }: { severity: Validation["severity"] }) => (
  <span
    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
      severity === "error"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700"
    }`}
  >
    {severity}
  </span>
);

const ValidationRow = ({ v }: { v: Validation }) => (
  <li className="flex flex-col gap-1 py-2 px-2 rounded hover:bg-gray-50 border-b border-gray-100 last:border-0">
    <div className="flex flex-wrap items-center gap-1.5">
      <SeverityBadge severity={v.severity} />
      <StatusBadge label="shown" active={v.shown ?? false} />
      <span className="font-mono text-xs text-gray-400">{v.id.slice(0, 8)}</span>
    </div>
    <p className="text-sm text-gray-800">{v.message}</p>
    {v.attributes.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {v.attributes.map((a) => (
          <span key={a} className="font-mono text-xs bg-gray-100 text-gray-600 rounded px-1 py-0.5">
            {a}
          </span>
        ))}
      </div>
    )}
  </li>
);

export const ValidationsTab = () => {
  const { session } = useInterview();
  const validations = session?.validations ?? [];

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-gray-500">
        Validations ({validations.length})
      </h3>
      {validations.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No validations</p>
      ) : (
        <ul className="space-y-0">
          {validations.map((v) => (
            <ValidationRow key={v.id} v={v} />
          ))}
        </ul>
      )}
    </div>
  );
};
