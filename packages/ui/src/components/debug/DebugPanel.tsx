import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownLeft, Bug } from "lucide-react";
import { OverviewTab } from "./tabs/OverviewTab";
import { FormTab } from "./tabs/FormTab";
import { FormStateTab } from "./tabs/FormStateTab";
import { StepsTab } from "./tabs/StepsTab";
import { ControlsTab } from "./tabs/ControlsTab";
import { SessionTab } from "./tabs/SessionTab";
import { SessionDataTab } from "./tabs/SessionDataTab";
import { ValidationsTab } from "./tabs/ValidationsTab";
import { SequenceTab } from "./tabs/SequenceTab";
import { useDebugSettings } from "@/providers";

type Tab = "overview" | "form" | "form-state" | "steps" | "controls" | "session" | "session-data" | "validations" | "sequence";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "session", label: "Session" },
  { id: "session-data", label: "Session data" },
  { id: "validations", label: "Validations" },
  { id: "form", label: "Form" },
  { id: "form-state", label: "Form state" },
  { id: "steps", label: "Steps" },
  { id: "controls", label: "Controls" },
  { id: "sequence", label: "Sequence" },
];

const DEFAULT_SIZE = { width: 600, height: 420 };
const COLLAPSED_W = 98;
const COLLAPSED_H = 36;
const getDefaultPos = () => ({ x: 20, y: 20 }); // left, bottom offsets

// Module-level memory so state survives remounts (e.g. screen changes)
const panelMemory = {
  expanded: false,
  activeTab: "overview" as Tab,
  pos: getDefaultPos(),
  size: DEFAULT_SIZE,
};

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
  const [expanded, setExpanded] = useState(() => panelMemory.expanded);
  const [activeTab, setActiveTab] = useState<Tab>(() => panelMemory.activeTab);
  const [pos, setPos] = useState(() => panelMemory.pos);
  const [size, setSize] = useState(() => panelMemory.size);

  const [isInteracting, setIsInteracting] = useState(false);

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
    setIsInteracting(true);

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!hasDragged.current && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        hasDragged.current = true;
      }
      // Y is inverted because we anchor to bottom
      const newPos = { x: startPosX + dx, y: startPosY - dy };
      posRef.current = newPos;
      panelMemory.pos = newPos;
      setPos(newPos);
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      setIsInteracting(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  const startResize = useCallback((e: React.MouseEvent, corner: "top-right" | "bottom-right") => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.width;
    const startH = sizeRef.current.height;
    const startPosY = posRef.current.y;
    const isBottom = corner === "bottom-right";

    document.body.style.userSelect = "none";
    document.body.style.cursor = isBottom ? "nwse-resize" : "nesw-resize";
    setIsInteracting(true);

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      // top-right: drag up (negative dy) grows height
      // bottom-right: drag down (positive dy) grows height, pos.y adjusts to keep top edge fixed
      const newH = isBottom
        ? Math.max(240, startH + dy)
        : Math.max(240, startH - dy);
      const newSize = { width: Math.max(320, startW + dx), height: newH };
      sizeRef.current = newSize;
      panelMemory.size = newSize;
      setSize(newSize);
      if (isBottom) {
        const newPos = { x: posRef.current.x, y: startPosY - (newH - startH) };
        posRef.current = newPos;
        panelMemory.pos = newPos;
        setPos(newPos);
      }
    };

    const onUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setIsInteracting(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  if (!debugEnabled) return null;

  const transition = isInteracting ? undefined : "width 200ms ease, height 200ms ease";

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: pos.x,
        bottom: pos.y,
        width: expanded ? size.width : COLLAPSED_W,
        height: expanded ? size.height : COLLAPSED_H,
        borderRadius: 8,
        zIndex: "var(--interview-ui-z-index-debug)" as unknown as number,
        transition,
      }}
      className={`flex flex-col shadow-xl overflow-hidden ${
        expanded ? "bg-white border border-gray-200" : "bg-gray-900"
      }`}
    >
      {!expanded ? (
        <button
          type="button"
          onMouseDown={startDrag}
          onClick={() => { if (!hasDragged.current) { panelMemory.expanded = true; setExpanded(true); } }}
          title="Open Debug Panel"
          className="flex items-center gap-2 text-sm font-medium cursor-grab active:cursor-grabbing text-white w-full h-full px-3 hover:bg-gray-700 transition-colors"
        >
          <Bug size={14} />
          <span>Debug</span>
        </button>
      ) : (
        <>
          {/* Drag handle header */}
          <div
            onMouseDown={startDrag}
            className="flex items-center justify-between px-3 py-2 bg-gray-900 text-white cursor-grab active:cursor-grabbing select-none shrink-0"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Bug size={14} />
              <span>Debug panel</span>
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { panelMemory.expanded = false; setExpanded(false); }}
              className="hover:bg-white/20 rounded p-0.5 transition-colors"
              title="Collapse"
            >
              <ArrowDownLeft size={14} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-gray-200 shrink-0 bg-gray-50 overflow-x-auto overflow-y-hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { panelMemory.activeTab = tab.id; setActiveTab(tab.id); }}
                className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px shrink-0 whitespace-nowrap ${
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
            {activeTab === "session" && <SessionTab />}
            {activeTab === "session-data" && <SessionDataTab />}
            {activeTab === "validations" && <ValidationsTab />}
            {activeTab === "form" && <FormTab />}
            {activeTab === "form-state" && <FormStateTab />}
            {activeTab === "steps" && <StepsTab />}
            {activeTab === "controls" && <ControlsTab />}
            {activeTab === "sequence" && <SequenceTab />}
          </div>

          {/* Resize handle — top-right (invisible) */}
          <div
            onMouseDown={(e) => startResize(e, "top-right")}
            style={{ position: "absolute", top: 0, right: 0, width: 18, height: 18, cursor: "nesw-resize" }}
            aria-hidden="true"
          />

          {/* Resize handle — bottom-right (visible) */}
          <div
            onMouseDown={(e) => startResize(e, "bottom-right")}
            style={{ position: "absolute", bottom: 0, right: 0, width: 18, height: 18, cursor: "nwse-resize" }}
            className="flex items-end justify-end p-1 opacity-40 hover:opacity-90 text-gray-500"
            title="Resize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
              <path d="M9 5H7V7H9V5ZM9 9H7V7H9V9ZM5 9H3V7H5V9Z" />
            </svg>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
};
