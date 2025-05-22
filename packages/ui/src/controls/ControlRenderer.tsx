import clsx from "clsx";
import { themeMerge } from "../providers/ThemeProvider";
import { TextControl } from "./TextControl";

export interface ControlDef {
  id: string;
  type: string;
  label?: string;
  value?: any;
  required?: boolean;
  controls?: ControlDef[]; 
  [key: string]: any;
}

export const defaultRenderControl: any = (control: ControlDef, classNames: any, renderControl: any, overrides: any) => {
  // Placeholder: just render label and input for type 'text', and recurse for containers
  if (overrides && overrides[control.type]) return overrides[control.type](control);
  if (control.type === 'container' && control.controls) {
    return (
      <div key={control.id} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
        <div>{control.label}</div>
        {control.controls.map(child => renderControl(child, classNames, renderControl, overrides))}
      </div>
    );
  }
  if (control.type === 'text') {
    return (

      <div key={control.id} className={clsx('dcsvly-ctrl-text',classNames.Text.root)}>
        <label className={clsx('dcsvly-ctrl-text-label', classNames.Text.label)}>
          {control.label}
          <input className={clsx('dcsvly-ctrl-text-input', classNames.Text.input)} type="text" name={control.id} defaultValue={control.value || ''} />
        </label>
      </div>
    );
  }
  // Add more types as needed
  return <div key={control.id}>Unknown control type: {control.type}</div>;
};

export const ControlRenderer = (props: any) => {
  const { control, classNames, controlOverrides } = props;
  if (controlOverrides && controlOverrides[control.type]) return controlOverrides[control.type](control, classNames, controlOverrides);
  switch (control.type) {
    case 'text':
      return <TextControl control={control} classNames={classNames?.Text} />
    default:
      return <div key={control.id}>Unknown control type: {control.type}</div>;
  }

}