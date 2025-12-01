import { InterviewControl } from "@/interview/InterviewControl";
import { useTheme } from "@/providers";
import type { Control, OptionsControl } from "@imminently/interview-sdk";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import type React from "react";
import Containers from "./containers";
import Controls from "./controls";
import { useCallback } from "react";

const MissingControl = ({ control }: { control: Control }) => {
  const { t } = useTheme();
  // @ts-ignore TEMP display unsupported control type
  const label = t(control.label || control.text);
  console.log("Missing control", control);
  return (
    <span key={control.id}>
      {control.type}: {label}
    </span>
  );
};

// allow type override for controls like select and radio
const SlottableFormControl =
  (slot: React.FC<any>, type?: string) =>
    ({ control }: any) => {
      const { getControl } = useTheme();
      const Comp = getControl(type ?? control.type) ?? slot;
      return <InterviewControl control={control}><Comp /></InterviewControl>;
    };

// Same as SlottableFormControl, but for controls that are not InterviewControls
const SlottableControl =
  (slot: React.FC<any>) =>
    ({ control }: any) => {
      const { getControl } = useTheme();
      const Comp = getControl(control.type) ?? slot;
      return <Comp control={control} />;
    };

// Must store these in a constant to avoid re-creating components on every render
const CONTROL_COMPONENTS: Record<string, React.ComponentType<any>> = {
  boolean: SlottableFormControl(Controls.Boolean),
  combobox: SlottableFormControl(Controls.Combobox, "combobox"),
  currency: SlottableFormControl(Controls.Currency),
  date: SlottableFormControl(Controls.Date),
  entity: Controls.Entity, // do not support slottable yet, as entities are complicated
  file: SlottableFormControl(Controls.File),
  markdown: SlottableControl(Controls.Markdown), // markdown is a special case, as it is not a form control
  number: SlottableFormControl(Controls.Number),
  radio: SlottableFormControl(Controls.Radio, "radio"),
  select: SlottableFormControl(Controls.Select, "select"),
  text: SlottableFormControl(Controls.Text),
  time: SlottableFormControl(Controls.Time),
  typography: SlottableControl(Controls.Typography), // typography is a special case, as it is not a form control
  certainty_container: Containers.Certainty, // do not support slottable yet, as containers are complicated
  interview_container: Containers.Interview, // do not support slottable yet, as containers are complicated
  repeating_container: Containers.Repeating, // do not support slottable yet, as containers are complicated
  switch_container: Containers.Switch, // do not support slottable yet, as containers are complicated
};

const getOptionsComponent = (control: OptionsControl) => {
  if (control.asRadio) {
    // Special case for options that depends on control.asRadio
    return CONTROL_COMPONENTS["radio"];
  }
  if (control.asyncOptions) {
    // Special case for options that depends on control.asyncOptions
    return CONTROL_COMPONENTS["combobox"];
  }
  // Default select
  return CONTROL_COMPONENTS["select"];
}

const getControlComponent = (control: Control): React.ComponentType<any> => {
  if (control.type === "options") {
    return getOptionsComponent(control as OptionsControl);
  }
  if (control.type === "typography") {
    if (control.customClassName === "md") {
      // Special case for typography that depends on style
      return CONTROL_COMPONENTS["markdown"];
    }
  }
  return CONTROL_COMPONENTS[control.type] ?? MissingControl;
};

const ControlFallback = ({ error, control }: FallbackProps & { control: Control }) => {
  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
      <h2 className="font-bold">Failed to render control.</h2>
      <pre className="text-wrap">{error.message}</pre>
      <pre className="mt-2 text-sm text-wrap">{JSON.stringify(control, null, 2)}</pre>
    </div>
  );
}

export const RenderControl = ({ control }: { control: Control }) => {
  const Component = control ? getControlComponent(control) : null;
  if (!Component) return null;
  const fallback = useCallback((props: FallbackProps) => <ControlFallback {...props} control={control} />, [control]);
  return (
    <ErrorBoundary FallbackComponent={fallback} >
      <Component control={control} />
    </ErrorBoundary >
  );
};
