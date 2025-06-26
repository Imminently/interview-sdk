import React from "react";
import type { Control } from "@/core";
import Controls from "./controls";
import Containers from "./containers";
import { OptionsFormControl } from "./controls/OptionsControl";

const MissingControl = ({ control }: { control: Control }) => {
  // @ts-ignore TEMP display unsupported control type
  const label = control.label || control.text;
  console.log('Missing control', control)
  return <span key={control.id}>{control.type}: {label}</span>;
};

const getControlComponent = (control: Control): (props: any) => React.ReactElement | null => {
  switch (control.type) {
    case "boolean":
      return Controls.Boolean;
    case "currency":
      return Controls.Currency;
    case "date":
      return Controls.Date;
    case "entity":
      return Controls.Entity;
    case "file":
      return Controls.File;
    case "options":
      return OptionsFormControl;
    case "text":
      return Controls.Text;
    case "time":
      return Controls.Time;
    case "typography":
      return Controls.Typography;
    case "certainty_container":
      return Containers.Certainty;
    case "interview_container":
      return Containers.Interview;
    case "repeating_container":
      return Containers.Repeating;
    case "switch_container":
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
