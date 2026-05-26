import { useInterview } from "@/interview/InterviewContext";
import type { Step } from "@imminently/interview-sdk";

interface CoreStep {
  id: string;
  title: string;
  current: boolean;
  complete: boolean;
  visited: boolean;
  skipped: boolean;
  visitable: boolean;
  steps?: CoreStep[];
}

const stripStep = (step: Step): CoreStep => ({
  id: step.id,
  title: step.title,
  current: step.current,
  complete: step.complete,
  visited: step.visited,
  skipped: step.skipped,
  visitable: step.visitable,
  steps: step.steps?.map(stripStep),
});

const StatusBadge = ({ label, active }: { label: string; active: boolean }) => (
  <span
    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
      active
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-400"
    }`}
  >
    {label}
  </span>
);

const StepRow = ({ step, depth = 0 }: { step: CoreStep; depth?: number }) => (
  <li>
    <div
      className={`flex flex-wrap items-center gap-1.5 py-1 px-2 rounded ${
        step.current ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
      }`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      <span className="font-mono text-xs text-gray-400 shrink-0">{step.id.slice(0, 8)}</span>
      <span className="text-sm text-gray-800 flex-1 min-w-0 truncate">{step.title}</span>
      <div className="flex items-center gap-1 shrink-0">
        {step.current && <StatusBadge label="current" active />}
        {step.complete && <StatusBadge label="done" active />}
        {step.visited && <StatusBadge label="visited" active />}
        {step.skipped && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
            skipped
          </span>
        )}
        {!step.visitable && (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">
            nav-only
          </span>
        )}
      </div>
    </div>
    {step.steps && step.steps.length > 0 && (
      <ul className="mt-0.5 space-y-0.5">
        {step.steps.map((child) => (
          <StepRow key={child.id} step={child} depth={depth + 1} />
        ))}
      </ul>
    )}
  </li>
);

export const StepsTab = () => {
  const { session } = useInterview();
  const steps = session?.steps ?? [];
  const coreSteps = steps.map(stripStep);

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3 text-xs uppercase tracking-wide text-gray-500">
        Steps ({steps.length})
      </h3>
      {coreSteps.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No steps available</p>
      ) : (
        <ul className="space-y-0.5 text-sm">
          {coreSteps.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </ul>
      )}
    </div>
  );
};
