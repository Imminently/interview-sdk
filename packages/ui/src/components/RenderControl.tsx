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

const SlottableFormControl = (slot: React.FC<any>) => ({ control }: any) => {
  const { getControl } = useTheme();
  const Comp = getControl(control.type) ?? slot;
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

const getControlComponent = (control: Control): (props: any) => React.ReactElement | null => {
  switch (control.type) {
    case "boolean":
      return SlottableFormControl(Controls.Boolean);
    case "currency":
      return SlottableFormControl(Controls.Currency);
    case "date":
      return SlottableFormControl(Controls.Date);
    case "entity":
      // do not support slottable yet, as entities are complicated
      return Controls.Entity;
    case "file":
      return SlottableFormControl(Controls.File);
    case "options":
      return SlottableFormControl(control.asRadio ? Controls.Radio : Controls.Select);
    case "text":
      return SlottableFormControl(Controls.Text);
    case "time":
      return SlottableFormControl(Controls.Time);
    case "typography":
      // typography is a special case, as it is not a form control
      return SlottableControl(Controls.Typography);
    case "certainty_container":
      // do not support slottable yet, as containers are complicated
      return Containers.Certainty;
    case "interview_container":
      // do not support slottable yet, as containers are complicated
      return Containers.Interview;
    case "repeating_container":
      // do not support slottable yet, as containers are complicated
      return Containers.Repeating;
    case "switch_container":
      // do not support slottable yet, as containers are complicated
      return Containers.Switch;
    default:
      return MissingControl;
  };
};

export const RenderControl = ({ control }: { control: Control }) => {
  const comp = getControlComponent(control);
  if (!comp) return null;
  return React.createElement(comp, { control });
};
