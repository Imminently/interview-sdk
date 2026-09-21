import { useInterview } from "@/interview/InterviewContext";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import type { Control } from "@imminently/interview-sdk";
import type React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export interface DebugTriggerProps {
  /** The control this debug affordance is attached to - shift+click hands it to onDebugControlClick. */
  control: Control;
  /** Payload logged to the console on a plain click. */
  logPayload: Record<string, unknown>;
  /** Collapsed row content, shown inline wherever this control renders. */
  children: React.ReactNode;
  /** Extra content shown above the standard click/shift+click hint in the tooltip popover. */
  tooltipContent?: React.ReactNode;
  className?: string;
}

/**
 * Shared debug affordance for a rendered control: a click logs the control to the console,
 * shift+click hands it to `onDebugControlClick` instead, and hovering shows a tooltip. Shared
 * by FormItemDebug and TypographyDebug, which differ only in what attribute info/extra fields
 * they show inline and in the tooltip.
 *
 * Callers are responsible for their own `debugEnabled` gate, and for checking it *before* doing
 * any attribute lookup - not just before rendering this component - since that lookup can be
 * arbitrarily expensive (or, in a test double standing in for the real manager, simply absent).
 */
export const DebugTrigger = ({ control, logPayload, children, tooltipContent, className }: DebugTriggerProps) => {
  const { t } = useTheme();
  const context = useInterview();
  const hasDebugCallback = !!context.callbacks.onDebugControlClick;

  const handleDebugClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only take over the click (and stop it reaching anything else) when shift+click actually
    // does something - with no callback registered there's nothing to hand off to, so fall
    // through to the same default logging a plain click gets.
    if (e.shiftKey && hasDebugCallback) {
      e.preventDefault();
      e.stopPropagation();
      context.callbacks.onDebugControlClick?.(control, context);
      return;
    }

    // default action is just console log the control
    console.log("[DEBUG] Form control data", logPayload);
  };

  // doing a weird fallback tooltip, as our translation layer fallbacks to the key
  const defaultTooltip = hasDebugCallback
    ? "Click to log control to console. Shift+Click to trigger debug callback."
    : "Click to log control to console.";
  const tooltipKey = "form.debugTooltip";
  const tooltip = t(tooltipKey) !== tooltipKey ? t(tooltipKey) : defaultTooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={-1}
          onClick={handleDebugClick}
          data-slot="debug-info"
          className={cn("text-xs text-muted-foreground cursor-pointer", className)}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {tooltipContent}
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};
