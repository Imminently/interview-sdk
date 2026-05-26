import { useInterview } from "@/interview/InterviewContext";
import type { RenderableControl } from "@imminently/interview-sdk";
import { useState } from "react";

interface FlatControl {
  control: RenderableControl;
  path: string;
}

const flattenControls = (controls: RenderableControl[], parentPath = ""): FlatControl[] => {
  const result: FlatControl[] = [];

  for (const control of controls) {
    const path = parentPath ? `${parentPath} > ${control.id}` : control.id;
    result.push({ control, path });

    const c = control as any;
    if (Array.isArray(c.controls)) {
      result.push(...flattenControls(c.controls, path));
    }
    if (Array.isArray(c.certain)) {
      result.push(...flattenControls(c.certain, `${path}[certain]`));
    }
    if (Array.isArray(c.uncertain)) {
      result.push(...flattenControls(c.uncertain, `${path}[uncertain]`));
    }
    if (Array.isArray(c.outcome_true)) {
      result.push(...flattenControls(c.outcome_true, `${path}[true]`));
    }
    if (Array.isArray(c.outcome_false)) {
      result.push(...flattenControls(c.outcome_false, `${path}[false]`));
    }
    if (Array.isArray(c.instances)) {
      for (const instance of c.instances) {
        if (Array.isArray(instance.controls)) {
          result.push(...flattenControls(instance.controls, `${path}[${instance.id}]`));
        }
      }
    }
  }

  return result;
};

export const ControlsTab = () => {
  const { session } = useInterview();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RenderableControl | null>(null);

  const allControls = flattenControls(session?.screen?.controls ?? []);

  const filtered = search.trim()
    ? allControls.filter(({ control }) => {
        const q = search.toLowerCase();
        return (
          control.id.toLowerCase().includes(q) ||
          control.type.toLowerCase().includes(q) ||
          ((control as any).attribute ?? "").toLowerCase().includes(q) ||
          ((control as any).label ?? "").toLowerCase().includes(q)
        );
      })
    : allControls;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 shrink-0">
        <h3 className="font-semibold mb-2 text-xs uppercase tracking-wide text-gray-500">
          Controls on screen ({allControls.length})
        </h3>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by id, type, attribute, label…"
          className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
      </div>

      {selected ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 shrink-0">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-blue-600 hover:underline"
            >
              ← Back
            </button>
            <span className="text-xs text-gray-500 font-mono truncate">{selected.id}</span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded p-2 whitespace-pre-wrap break-all">
              <code>{JSON.stringify(selected, null, 2)}</code>
            </pre>
          </div>
        </div>
      ) : (
        <ul className="flex-1 overflow-auto divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-400 italic">No controls match</li>
          ) : (
            filtered.map(({ control, path }) => (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => setSelected(control)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                      {control.type}
                    </span>
                    <span className="text-xs font-mono text-gray-700 truncate">
                      {(control as any).attribute ?? control.id}
                    </span>
                  </div>
                  {(control as any).label && (
                    <div className="mt-0.5 text-xs text-gray-500 truncate">{(control as any).label}</div>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
