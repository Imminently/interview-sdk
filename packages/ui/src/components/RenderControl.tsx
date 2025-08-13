import React from "react";
import type { Control } from "@imminently/interview-sdk";
import Controls from "./controls";
import Containers from "./containers";
import { useTheme } from "@/providers";
import { InterviewControl } from "@/interview/InterviewControl";

const MissingControl = ({ control }: { control: Control }) => {
  const { t } = useTheme();
  // @ts-ignore TEMP display unsupported control type
  const label = t(control.label || control.text);
  console.log('Missing control', control)
  return <span key={control.id}>{control.type}: {label}</span>;
};

// allow type override for controls like select and radio
const SlottableFormControl = (slot: React.FC<any>, type?: string) => ({ control }: any) => {
  const { getControl } = useTheme();
  const Comp = getControl(type ?? control.type) ?? slot;
  return (
    <InterviewControl control={control}>
      {(props) => <Comp {...props} />}
    </InterviewControl>
  )
};

// Same as SlottableFormControl, but for controls that are not InterviewControls
const SlottableControl = (slot: React.FC<any>) => ({ control }: any) => {
  const { getControl } = useTheme();
  const Comp = getControl(control.type) ?? slot;
  return <Comp control={control} />;
}

// Must store these in a constant to avoid re-creating components on every render
const CONTROL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  boolean: SlottableFormControl(Controls.Boolean),
  currency: SlottableFormControl(Controls.Currency),
  date: SlottableFormControl(Controls.Date),
  entity: Controls.Entity, // do not support slottable yet, as entities are complicated
  file: SlottableFormControl(Controls.File),
  radio: SlottableFormControl(Controls.Radio, 'radio'),
  select: SlottableFormControl(Controls.Select, 'select'),
  text: SlottableFormControl(Controls.Text),
  time: SlottableFormControl(Controls.Time),
  typography: SlottableControl(Controls.Typography), // typography is a special case, as it is not a form control
  certainty_container: Containers.Certainty, // do not support slottable yet, as containers are complicated
  interview_container: Containers.Interview, // do not support slottable yet, as containers are complicated
  repeating_container: Containers.Repeating, // do not support slottable yet, as containers are complicated
  switch_container: Containers.Switch, // do not support slottable yet, as containers are complicated
};

const getControlComponent = (control: Control): React.ComponentType<any> => {
  if (control.type === "options") {
    // Special case for options that depends on control.asRadio
    return CONTROL_COMPONENTS[control.asRadio ? 'radio' : 'select'];
  }

  return CONTROL_COMPONENTS[control.type] ?? MissingControl;
};

export const RenderControl = ({ control }: { control: Control }) => {
  const Component = control ? getControlComponent(control) : null;
  if (!Component) return null;
  return <Component control={control} />;
};
