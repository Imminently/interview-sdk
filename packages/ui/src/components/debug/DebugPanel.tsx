import { useCallback, useRef, useState } from "react";
import { Bug, X } from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { FormTab } from "./tabs/FormTab";
import { StepsTab } from "./tabs/StepsTab";
import { ControlsTab } from "./tabs/ControlsTab";
import { useDebugSettings } from "@/providers";

type Tab = "overview" | "form" | "steps" | "controls";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "form", label: "Form" },
  { id: "steps", label: "Steps" },
  { id: "controls", label: "Controls" },
];

const DEFAULT_SIZE = { width: 600, height: 420 };
const DEFAULT_POS = { x: 20, y: 80 };

/**
 * A floating, draggable debug panel with tabs for inspecting interview state.
 *
 * Tabs:
 * - Overview: snapshot info, dynamic processing toggles
 * - Form: current form values as JSON
 * - Steps: stripped step tree (no layout/sidebar data)
 * - Controls: searchable list of all controls on the current screen
 *
 * Collapses to a small draggable icon button when minimised.
 */
export const DebugPanel = () => {
  const { debugEnabled } = useDebugSettings();
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pos, setPos] = useState(DEFAULT_POS);
  const [size, setSize] = useState(DEFAULT_SIZE);

  const posRef = useRef(pos);
  const sizeRef = useRef(size);
  const hasDragged = useRef(false);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    hasDragged.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = posRef.current.x;
    const startPosY = posRef.current.y;

    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!hasDragged.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasDragged.current = true;
      }
      const newPos = { x: startPosX + dx, y: startPosY + dy };
      posRef.current = newPos;
      setPos(newPos);
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.width;
    const startH = sizeRef.current.height;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "nwse-resize";

    const onMove = (ev: MouseEvent) => {
      const newSize = {
        width: Math.max(320, startW + (ev.clientX - startX)),
        height: Math.max(240, startH + (ev.clientY - startY)),
      };
      sizeRef.current = newSize;
      setSize(newSize);
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  if (!debugEnabled) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          zIndex: "var(--interview-ui-z-index-debug)",
        } as React.CSSProperties}
        onMouseDown={startDrag}
        onClick={() => {
          if (!hasDragged.current) setExpanded(true);
        }}
        title="Open Debug Panel"
        className="flex items-center gap-2 text-sm font-medium cursor-grab active:cursor-grabbing bg-gray-900 text-white rounded-full px-3 py-2 shadow-lg hover:bg-gray-700 transition-colors"
      >
        <Bug size={14} />
        <span>Debug</span>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex: "var(--interview-ui-z-index-debug)" as unknown as number,
      }}
      className="flex flex-col bg-white border border-gray-200 shadow-xl rounded-lg overflow-hidden"
    >
      {/* Drag handle header */}
      <div
        onMouseDown={startDrag}
        className="flex items-center justify-between px-3 py-2 bg-gray-900 text-white cursor-grab active:cursor-grabbing select-none shrink-0 rounded-t-lg"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bug size={14} />
          <span>Debug panel</span>
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setExpanded(false)}
          className="hover:bg-white/20 rounded p-0.5 transition-colors"
          title="Collapse"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 shrink-0 bg-gray-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "form" && <FormTab />}
        {activeTab === "steps" && <StepsTab />}
        {activeTab === "controls" && <ControlsTab />}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, cursor: "nwse-resize" }}
        className="flex items-end justify-end p-1 opacity-40 hover:opacity-90 text-gray-500"
        title="Resize"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path d="M9 5H7V7H9V5ZM9 9H7V7H9V9ZM5 9H3V7H5V9Z" />
        </svg>
      </div>
    </div>
  );
};
