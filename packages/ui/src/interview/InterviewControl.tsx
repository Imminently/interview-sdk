import { isReadOnly } from "@/components/controls/ReadOnlyControl";
import type { Control, RenderableControl } from "@imminently/interview-sdk";
import type React from "react";
import { useEffect, useMemo } from "react";
import { type RegisterOptions, type UseControllerReturn, useFormContext } from "react-hook-form";
import { FormField, FormItem } from "../components/ui/form";
import { MAX_INLINE_LABEL_LENGTH } from "../util";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { generateValidatorForControl, useAttributeValidationErrors } from "../util/validation";
import { useOptions } from "@/providers";

export interface InterviewControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
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
    // case "date":
    // case "datetime":
    case "time":
      return "";
    default:
      return undefined;
  }
};

export const InterviewControl = ({ control, children }: InterviewControlProps) => {
  // @ts-ignore
  const { attribute, hidden } = control;
  const { inlineErrors } = useOptions();
  const { unregister, ...form } = useFormContext();
  // take a local copy
  // TODO why do some of the controls have booleans listed as type 'true'?
  const resolvedControl: Omit<Control, "disabled"> & {
    disabled: boolean;
    readOnly: boolean;
  } = useMemo(() => {
    const readOnly = isReadOnly(control);
    return { ...control, readOnly, disabled: readOnly };
  }, [control]);
  // @ts-ignore
  const name: string = useAttributeToFieldName(attribute) ?? control.entity;

  const defaultValue =
    // @ts-ignore
    resolvedControl.value ??
    // @ts-ignore
    resolvedControl.default ??
    getControlDefault(resolvedControl.type);

  const rules: RegisterOptions = useMemo(
    () => ({
      validate: (value) => {
        const schema = generateValidatorForControl(resolvedControl as RenderableControl);
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
    }),
    [resolvedControl],
  );

  // set validation errors from the session object
  const { setError, clearErrors } = form;
  const validations = useAttributeValidationErrors(control.attribute);
  useEffect(() => {
    // don't set errors if inlineErrors is false
    if(!inlineErrors) return;

    if (validations.length > 0) {
      // clear the errors, then set the first one
      clearErrors(name);
      const msg = validations.map((v) => v.message).join(". ");
      setError(name, { type: "manual", message: msg });
    } else {
      clearErrors(name);
    }
  }, [name, validations, setError, clearErrors, inlineErrors]);

  // don't render if the control is hidden
  if (hidden) {
    return null;
  }

  return (
    <FormField
      name={name}
      data={resolvedControl as Control}
      control={form.control}
      defaultValue={defaultValue}
      disabled={resolvedControl.disabled ?? false}
      rules={rules}
      shouldUnregister={true}
      render={(props) => (
        <>
          <FormItem>
            {children(props)}
          </FormItem>
        </>
      )}
    />
  );
};
