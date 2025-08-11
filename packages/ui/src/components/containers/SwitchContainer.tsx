import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import type { Control, RenderableSwitchContainerControl } from "@imminently/interview-sdk";
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

    return { ...it, attribute: parentPathParts.concat(it.attribute).join(attribute.includes("/") ? "/" : ".") };
  });
};

export const SwitchContainer = ({ control }: { control: RenderableSwitchContainerControl }) => {
  const { outcome_true, outcome_false, branch, attribute } = control;
  const { watch } = useFormContext();
  const value = attribute ? watch(attribute) : false; // Ensure the switch is aware of its target attribute
  const controls = ((branch === "true" || value) ? outcome_true : outcome_false) || [];

  const mappedControls = useMemo(() => mapControls(controls, attribute), [controls, attribute]);

  if (mappedControls.length === 0) return null;

  return (
    <>
      {mappedControls.map((ctrl, index) => <RenderControl key={`${index}-${ctrl.id}`} control={ctrl} />)}
    </>
  );
};
