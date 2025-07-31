import React, { useEffect, useMemo } from "react";
import { RegisterOptions, UseControllerReturn, useFormContext } from "react-hook-form";
import { type Control } from "@imminently/interview-sdk";
import { MAX_INLINE_LABEL_LENGTH } from "../util";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { generateValidatorForControl, useAttributeValidationErrors } from "../util/validation";
import { FormField, FormItem } from "../components/ui/form";
import { isReadOnly, ReadOnlyControl } from "@/components/controls/ReadOnlyControl";
import { useInterview } from "./InterviewContext";

export interface InterviewControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  control: Control;
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

export const InterviewControl = ({ control, children }: InterviewControlProps) => {
  // @ts-ignore
  const { attribute, hidden } = control;
  const { readOnly: forceReadOnly } = useInterview();
  const form = useFormContext();
  const readOnly = forceReadOnly ?? isReadOnly(control);

  // take a local copy
  const resolvedControl: Control & { disabled?: boolean } = useMemo(() => ({ ...control }), [control]);
  // @ts-ignore
  const name: string = useAttributeToFieldName(attribute) ?? control.entity;
  // @ts-ignore
  const defaultValue = resolvedControl.value ?? resolvedControl.default ?? getControlDefault(resolvedControl.type);

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

  // TEMP disabling as it was causing recursive updates and max depth exceeded errors
  // set validation errors from the session object
  // const { setError, clearErrors } = form;
  // const validations = useAttributeValidationErrors(control.attribute);
  // useEffect(() => {
  //   if (validations.length > 0) {
  //     setError(name, { type: "manual", message: validations[0].message });
  //   } else {
  //     clearErrors(name);
  //   }
  // }, [name, validations, setError, clearErrors]);

  // don't render if the control is hidden
  if (hidden) {
    return null;
  }

  // we only override the render if the control is readOnly and labelDisplay is "automatic"
  if (readOnly && (control as any).labelDisplay === "automatic") {
    return (
      <FormField
        name={name}
        data={resolvedControl}
        control={form.control}
        defaultValue={defaultValue}
        render={(props) => (
          <FormItem>
            <ReadOnlyControl {...props} />
          </FormItem>
        )}
      />
    );
  } else if (readOnly) {
    // @ts-ignore since its flagged readOnly, we want to force it disabled
    resolvedControl.disabled = true;
  }

  return (
    <FormField
      name={name}
      data={resolvedControl}
      control={form.control}
      defaultValue={defaultValue}
      disabled={resolvedControl.disabled ?? false}
      rules={rules}
      shouldUnregister={true}
      render={(props) => (
        <FormItem>
          {children(props)}
        </FormItem>
      )}
    />
  );
};
