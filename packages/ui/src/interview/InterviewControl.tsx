import React, { useMemo } from "react";
import { RegisterOptions, UseControllerReturn, useFormContext } from "react-hook-form";
import { type Control } from "@imminently/interview-sdk";
import { Error } from "../components/controls/Error";
import { MAX_INLINE_LABEL_LENGTH } from "../util";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { generateValidatorForControl } from "../util/Validation";
import { Explanation } from "../components/controls/Explanation";
import { FormField, FormItem } from "../components/ui/form";
import Text from "../components/ui/text";
import { useTheme } from "@/providers";

export interface FormControlError {
  message: string;
}

export interface InterviewControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  control: Control;
  renderValue?: (value: string) => React.ReactNode;
  children: (props: UseControllerReturn) => React.ReactElement;
}

export interface FormControlRenderState {
  onChange: (value: any) => void;
  value: any;
  forId: string;
  error: { message: string } | undefined;
  inlineLabel: string | undefined;
  disabled?: boolean;
}

const isLabelTooLong = (label: string | undefined): label is string => {
  if (typeof label === "string") {
    if (label.length > MAX_INLINE_LABEL_LENGTH) {
      return true;
    }
  }
  return false;
};

const isReadOnly = (control: Control) => {
  // if control type is not expected to have "readOnly" -> return
  if (
    control.type !== "boolean" &&
    control.type !== "currency" &&
    control.type !== "date" &&
    control.type !== "time" &&
    control.type !== "datetime" &&
    control.type !== "options" &&
    control.type !== "number_of_instances" &&
    control.type !== "text"
  ) {
    return false;
  }
  // return readOnly property if it exists, otherwise return false
  return control.readOnly ?? false;
}

const ReadOnlyControl = ({ control, renderValue = (v) => String(v) }: { control: Control, renderValue?: (v: any) => React.ReactNode }) => {
  const { t } = useTheme();
  // const { attribute } = control;
  // const interview = useInterview();
  // const { getValues } = useFormContext();

  // const pathedAttribute = attributeToPath(attribute, interview.session.data, getValues(), false);
  // const validations = interview.session.validations
  //   ?.filter((v) => v.shown && v.attributes.includes(pathedAttribute as string))
  //   .sort((a, b) => a.attributes.length - b.attributes.length);
  // const firstValidation = validations?.[0];

  // @ts-ignore
  const label = t(control.label);
  // @ts-ignore
  const value = renderValue(control.value);

  return (
    <div className="flex flex-row gap-2">
      <Text>{label}</Text>
      <Text>{value}</Text>
      <Explanation control={control} />
      {/* {firstValidation && <Error id={control.id} />} */}
      <Error id={control.id} />
    </div>
  );
}

// as forms are weird, we need to ensure we have the correct default value for each control type
const getControlDefault = (type: string) => {
  switch (type) {
    case "boolean":
      return undefined; // use undefined as we support indeterminate state
    case "currency":
      return 0;
    case "text":
    case "number_of_instances":
      return "";
    default:
      return undefined;
  }
}

export const InterviewControl = ({ control, renderValue, className, children }: InterviewControlProps) => {
  // @ts-ignore
  const { attribute, hidden } = control;
  // const interview = useInterview();
  const form = useFormContext();
  const readOnly = isReadOnly(control);

  // take a local copy
  const resolvedControl = useMemo(() => ({ ...control }), [control]);
  // @ts-ignore
  const name: string = useAttributeToFieldName(attribute) ?? control.entity;

  if (hidden) {
    return null;
  }

  // we only override the render if the control is readOnly and labelDisplay is "automatic"
  if (readOnly && (control as any).labelDisplay === "automatic") {
    return <ReadOnlyControl control={control} renderValue={renderValue} />;
  } else {
    // @ts-ignore
    resolvedControl.disabled = true;
  }

  // @ts-ignore
  const defaultValue = resolvedControl.value ?? resolvedControl.default ?? getControlDefault(resolvedControl.type);
  // console.log(`[Control::${control.type}] defaultValue`, defaultValue, control);
  // const label = "label" in resolvedControl ? resolvedControl.label : undefined;
  const rules: RegisterOptions = useMemo(() => ({
    validate: (value) => {
      const schema = generateValidatorForControl(resolvedControl as any);
      if (!schema) {
        return true;
      }
      try {
        schema.validateSync(value);
        return true;
      } catch (e: any) {
        return e.errors.join(", ");
      }
    },
  }), [resolvedControl]);

  return (
    <FormField
      name={name}
      data={resolvedControl}
      control={form.control}
      defaultValue={defaultValue}
      rules={rules}
      shouldUnregister={true}
      render={(props) => {
        return (
          <FormItem className={className}>
            {children(props)}
          </FormItem>
        );
      }}
    />
  );
};
