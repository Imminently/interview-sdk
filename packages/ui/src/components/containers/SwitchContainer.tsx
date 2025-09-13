import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useInterview } from "@/interview";
import { useDebugSettings, useOptions } from "@/providers";
import { getColor } from "@/util";
import type { Control, RenderableSwitchContainerControl } from "@imminently/interview-sdk";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { RenderControl } from "../RenderControl";

/**
 * we want to override child controls in case we are rendering\
 * this control inside a nested one, and so control.attribute\
 * is smth like uuid1.0.uuid2, but for children we want to swap\
 * uuid2 for uuid of each child attribute
 */
const mapControls = (controls: Control[], attribute?: string) => {
  if (attribute === undefined) return controls;

  const parentPathParts = attribute.split(attribute.includes("/") ? "/" : ".").slice(0, -1);
  if (!parentPathParts?.length) return controls;

  return controls.map((it) => {
    if (it.attribute === undefined) return it;

    if (it.attribute.startsWith(parentPathParts.join(".")) || it.attribute.includes("/")) {
      return it;
    }

    return {
      ...it,
      attribute: parentPathParts.concat(it.attribute).join(attribute.includes("/") ? "/" : "."),
    };
  });
};

export const SwitchContainer = ({
  control,
  className,
}: {
  control: RenderableSwitchContainerControl;
  className?: string;
}) => {
  const { outcome_true, outcome_false, branch, attribute } = control;

  const controls = (branch === "true" ? outcome_true : outcome_false) || [];

  const mappedControls = useMemo(() => mapControls(controls, attribute), [controls, attribute, branch]);

  const activeBranch = branch === "true" ? "true" : "false";

  const [openTrue, setOpenTrue] = useState(activeBranch === "true");
  const [openFalse, setOpenFalse] = useState(activeBranch === "false");

  const { advancedDebugEnabled, debugEnabled } = useDebugSettings();
  const interview = useInterview();

  const trueControls = outcome_true ?? [];
  const falseControls = outcome_false ?? [];
  const mappedTrueControls = useMemo(() => mapControls(trueControls, attribute), [trueControls, attribute]);
  const mappedFalseControls = useMemo(() => mapControls(falseControls, attribute), [falseControls, attribute]);

  if (advancedDebugEnabled) {
    if (mappedTrueControls.length + mappedFalseControls.length === 0) {
      return null;
    }

    const seed = attribute || control.id;
    const color = getColor(seed);

    return (
      <div
        onMouseDown={(e) => {
          if (debugEnabled && e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            interview.callbacks.onDebugControlClick?.(control, interview);
          }
        }}
        data-id={control.id}
        data-control={control.type}
        data-attribute={attribute}
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <div className="text-[10px] px-2 pt-1 text-muted-foreground">{attribute ?? control.id}</div>
        <Collapsible
          open={openTrue}
          onOpenChange={setOpenTrue}
        >
          <CollapsibleTrigger className="w-full text-left px-2 py-1 text-xs flex items-center gap-1">
            {openTrue ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            <span>
              branch: true {activeBranch === "true" ? "(active)" : ""} {openTrue ? "[open]" : "[closed]"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-2">
            {mappedTrueControls.length > 0 ? (
              mappedTrueControls.map((ctrl) => (
                <RenderControl
                  key={ctrl.id}
                  control={ctrl}
                />
              ))
            ) : (
              <div className="text-muted-foreground text-xs italic py-1">No controls</div>
            )}
          </CollapsibleContent>
        </Collapsible>
        <hr />
        <Collapsible
          open={openFalse}
          onOpenChange={setOpenFalse}
        >
          <CollapsibleTrigger className="w-full text-left px-2 py-1 text-xs flex items-center gap-1">
            {openFalse ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            <span>
              branch: false {activeBranch === "false" ? "(active)" : ""} {openFalse ? "[open]" : "[closed]"}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-2">
            {mappedFalseControls.length > 0 ? (
              mappedFalseControls.map((ctrl) => (
                <RenderControl
                  key={ctrl.id}
                  control={ctrl}
                />
              ))
            ) : (
              <div className="text-muted-foreground text-xs italic py-1">No controls</div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  if (mappedControls.length === 0) return null;

  return (
    <>
      {mappedControls.map((value) => (
        <RenderControl
          key={value.id}
          control={value}
        />
      ))}
    </>
  );

  // return (
  //   <div
  //     data-id={control.id}
  //     data-control={control.type}
  //     // data-attribute={control.attribute}
  //     data-loading={(control as any).loading ? "true" : undefined}
  //     className={className}
  //   >
  //     {mappedControls.map((value) => <RenderControl key={value.id} control={value} />)}
  //   </div>
  // );
};
