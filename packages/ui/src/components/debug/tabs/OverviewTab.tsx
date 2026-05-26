import { useInterview } from "@/interview/InterviewContext";
import { Computer, Server } from "lucide-react";
import { useState } from "react";

export const OverviewTab = () => {
  const { manager } = useInterview();
  const snapshot = manager.getSnapshot();
  const isClientDynamic = Boolean(manager.clientGraph);

  const [clientDisabled, setClientDisabled] = useState(manager.isClientDynamicDisabled());
  const [serverDisabled, setServerDisabled] = useState(manager.isServerDynamicDisabled());

  const toggleClientDynamic = () => {
    const next = !clientDisabled;
    manager.setDisableClientDynamic(next);
    setClientDisabled(next);
  };

  const toggleServerDynamic = () => {
    const next = !serverDisabled;
    manager.setDisableServerDynamic(next);
    setServerDisabled(next);
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      <section>
        <h3 className="font-semibold mb-1 text-xs uppercase tracking-wide text-gray-500">Keyboard shortcuts</h3>
        <ul className="list-disc list-inside space-y-0.5 text-gray-700">
          <li>Shift + Click a control to open the debug dialog</li>
          <li>Toggle debug with Cmd+D or Ctrl+D</li>
          <li>Press <kbd className="font-mono bg-gray-100 border border-gray-300 rounded px-1">`</kbd> to toggle container debug</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-1 text-xs uppercase tracking-wide text-gray-500">Snapshot</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-gray-500">isLoading</dt>
          <dd className="font-mono">{snapshot.loading.toString()}</dd>
          <dt className="text-gray-500">state</dt>
          <dd className="font-mono">{snapshot.state}</dd>
          <dt className="text-gray-500">renderAt</dt>
          <dd className="font-mono">{snapshot.renderAt}</dd>
        </dl>
      </section>

      <section>
        <h3 className="font-semibold mb-1 text-xs uppercase tracking-wide text-gray-500">Dynamic processing</h3>
        <div className="flex flex-row items-center gap-2 mb-3 text-gray-700">
          {isClientDynamic ? <Computer size={14} /> : <Server size={14} />}
          <span>{isClientDynamic ? "Client Side Dynamic" : "Server Side Dynamic"}</span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={clientDisabled}
              onChange={toggleClientDynamic}
              className="w-4 h-4 rounded border-gray-300 accent-red-500"
            />
            <span className={clientDisabled ? "text-red-600 font-medium" : "text-gray-700"}>
              Disable client-side processing
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={serverDisabled}
              onChange={toggleServerDynamic}
              className="w-4 h-4 rounded border-gray-300 accent-red-500"
            />
            <span className={serverDisabled ? "text-red-600 font-medium" : "text-gray-700"}>
              Disable server-side processing
            </span>
          </label>
        </div>
        {(clientDisabled || serverDisabled) && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            Warning: processing is partially disabled. Dynamic updates may not work correctly.
          </p>
        )}
      </section>
    </div>
  );
};
