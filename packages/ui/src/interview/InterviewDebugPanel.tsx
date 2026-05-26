import {
  Sidebar,
  SidebarContent,
  SidebarGroup
} from "@/components/ui/sidebar";
import { useTheme } from "@/providers";
import { useFormContext } from "react-hook-form";
import { useInterview } from "./InterviewContext";
import { useCallback, useMemo, useRef, useState } from "react";
import { getAttributeText } from "@imminently/interview-sdk";
import { Bug, X } from "lucide-react";


export const InterviewDebugForm = () => {
  const { t } = useTheme();
  const context = useInterview();
  const { watch } = useFormContext();
  const values = watch();

  const graph = useMemo(() => {
    const { manager } = context;
    console.log("manager.parsedGraph", manager.clientGraph, manager.parsedGraph);
    return manager.parsedGraph;
  }, [context])

  // map values to use node labels
  const data = Object.keys(values).reduce((acc, curr, index) => {
    const label = graph ? getAttributeText(curr, graph) : curr;
    acc[label] = values[curr];
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="p-4">
      <h2 className="mb-4 text-lg font-bold">{t("debug.form_values")}</h2>
      <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
    </div>
  );
}

export const InterviewDebugPanel = () => {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="sticky top-0 hidden h-svh border-l lg:flex w-[500px]"
    >
      <SidebarContent>
        <SidebarGroup>
          <InterviewDebugForm />
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

const DEFAULT_SIZE = { width: 600, height: 400 };
const DEFAULT_POS = { x: 20, y: 80 };

/**
 * A floating, draggable debug panel that wraps `InterviewDebugForm`.
 *
 * - Collapses to a small icon button that can be dragged anywhere on the page.
 * - Expands into a resizable rectangle panel.
 * - Position and size are stored in React state (in-memory only — resets on page refresh).
 */
export const InterviewDebugFloatingPanel = () => {
  const [expanded, setExpanded] = useState(false);
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
        width: Math.max(280, startW + (ev.clientX - startX)),
        height: Math.max(200, startH + (ev.clientY - startY)),
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

  if (!expanded) {
    return (
      <button
        type="button"
        style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: "var(--interview-ui-z-index-debug)" } as React.CSSProperties}
        onMouseDown={startDrag}
        onClick={() => { if (!hasDragged.current) setExpanded(true); }}
        title="Open Debug Panel"
        className="flex items-center gap-2 text-sm font-medium cursor-grab active:cursor-grabbing bg-gray-900 text-white rounded-full p-2.5 shadow-lg hover:bg-gray-700 transition-colors"
      >
        <Bug size={14} />
        <span>Debug panel</span>
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
        <div className="flex flex-row items-center gap-2 text-sm font-medium">
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto min-h-0">
        <InterviewDebugForm />
      </div>

      {/* Resize handle — bottom-right corner */}
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
