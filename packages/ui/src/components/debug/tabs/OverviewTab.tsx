import { Switch } from "@/components/ui/switch";
import { useInterview } from "@/interview/InterviewContext";
import { Computer, Server } from "lucide-react";
import { useState } from "react";

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="font-mono bg-gray-100 border border-gray-300 rounded px-1">{children}</kbd>
);

export const OverviewTab = () => {
  const { manager } = useInterview();
  const snapshot = manager.getSnapshot();
  const isClientDynamic = Boolean(manager.clientGraph);

  const [dynamicDisabled, setDynamicDisabled] = useState(manager.isDynamicDisabled());

  const renderAtLocal = snapshot.renderAt
    ? new Date(snapshot.renderAt).toLocaleTimeString()
    : null;

  return (
    <div className="p-4 flex flex-col gap-4 text-sm">
      <section>
        <h3 className="font-semibold mb-1 text-xs uppercase tracking-wide text-gray-500">Keyboard shortcuts</h3>
        <ul className="list-disc list-inside space-y-0.5 text-gray-700">
          <li>Shift + Click a control to open the debug dialog</li>
          <li>Toggle debug with <Kbd>Cmd</Kbd>+<Kbd>D</Kbd> or <Kbd>Ctrl</Kbd>+<Kbd>D</Kbd></li>
          <li>Press <Kbd>`</Kbd> to toggle container debug</li>
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
          <dd className="font-mono">
            {renderAtLocal ?? snapshot.renderAt}
            {renderAtLocal && (
              <span className="ml-2 text-gray-400 text-xs">{snapshot.renderAt}</span>
            )}
          </dd>
        </dl>
      </section>

      <section>
        <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
          <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-500">Dynamic processing</h3>
          <Switch
            checked={!dynamicDisabled}
            onCheckedChange={(checked) => {
              manager.setDisableDynamic(!checked);
              setDynamicDisabled(!checked);
            }}
          />
        </label>
        <div className="flex flex-row items-center gap-1.5 mt-1.5 text-xs text-gray-500">
          {isClientDynamic ? <Computer size={12} /> : <Server size={12} />}
          <span>{isClientDynamic ? "Client side" : "Server side"}</span>
        </div>
        {dynamicDisabled && (
          <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
            Warning: dynamic processing is disabled. Values will not update as you type.
          </p>
        )}
      </section>
    </div>
  );
};
