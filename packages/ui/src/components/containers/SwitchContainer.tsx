import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Control, RenderableSwitchContainerControl } from "@imminently/interview-sdk";
import { RenderControl } from "../RenderControl";
import {useOptions} from "@/providers";

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

    return { ...it, attribute: parentPathParts.concat(it.attribute).join(attribute.includes("/") ? "/" : ".") };
  });
};

export const SwitchContainer = ({ control, className }: { control: RenderableSwitchContainerControl, className?: string }) => {
  const { outcome_true, outcome_false, branch, attribute } = control;

  const { watch } = useFormContext();
  const value = attribute ? watch(attribute) : false; // Ensure the switch is aware of its target attribute
  const controls = ((branch === "true" || value) ? outcome_true : outcome_false) || [];
  // console.log("SwitchContainer controls", { controls, branch, attribute, value });

  const mappedControls = useMemo(() => mapControls(controls, attribute), [controls, attribute]);

  if (mappedControls.length === 0) return null;

  return (
    <>
      {mappedControls.map((value) => <RenderControl key={value.id} control={value} />)}
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
