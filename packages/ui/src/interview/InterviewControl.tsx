import { isReadOnly } from "@/components/controls/ReadOnlyControl";
import type { Control, RenderableControl } from "@imminently/interview-sdk";
import type React from "react";
import { useEffect, useMemo } from "react";
import { type RegisterOptions, useFormContext } from "react-hook-form";
import { FormField } from "../components/ui/form";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { useValidatorForControl, useAttributeValidationErrors } from "../util/validation";
import { useOptions } from "@/providers";
// import directly to avoid circular dependency
import { parseControl } from "@/components/parseControl";

export interface InterviewControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  control: Control;
  // children: (props: UseControllerReturn) => React.ReactElement;
  children: React.ReactNode;
}

// !!IMPORTANT!! the default value is very important
// we must respect the following precedence:
// 1. value set on the control (for pre-filled values)
// 2. default set on the control (for static defaults)
// 3. undefined (so RHF knows it's empty)
// The different between undefined and null is also very important
// undefined = unknown, ie the user ask not been asked yet
// null = uncertain, ie the user has been asked and explicitly did not provide a value
// Setting an empty string or 0 would be actual values, and not what the user actually provided
// The legacy system would only send null if the user gave empty string, which is technically incorrect
// We want to change to null if on screen, as that indicates the user has seen the question.
// Undefined is when the control gets hidden, either through a container or soeme else. Meaning they did not see it.
// This is risky however, as everything has been built using the legacy method.
// For now, we will make this experimental and opt-in.
const getDefaultValue = (control: any, strict: boolean = false) => {
  // we want fallback order of: value, default, undefined (or null if strict)
  // but value and default can be null as a valid value, so ?? won't work
  if (control.value !== undefined) return control.value;
  if (control.default !== undefined) return control.default;
  if (strict) return null;
  return undefined;
};

export const InterviewControl = ({ control, children }: InterviewControlProps) => {
  // @ts-ignore
  const { attribute, hidden } = control;
  const { inlineErrors, _experimental_strictMode } = useOptions();
  const { unregister, ...form } = useFormContext();
  // take a local copy
  // TODO why do some of the controls have booleans listed as type 'true'?
  const resolvedControl: Omit<Control, "disabled"> & {
    disabled: boolean;
    readOnly: boolean;
  } = useMemo(() => {
    const readOnly = isReadOnly(control);
    // parse the control here, so the later defaultValue uses the updated values
    // do NOT assign disabled as readOnly, as disabled will omit the value from submission
    // let the underlying control handle disabling with readonly as needed
    return parseControl({ ...control, readOnly });
  }, [control]);
  // @ts-ignore
  const name: string = useAttributeToFieldName(attribute) ?? control.entity;

  const defaultValue = getDefaultValue(resolvedControl, _experimental_strictMode);

  // Get the validator schema for this control (memoized based on control)
  const schema = useValidatorForControl(resolvedControl as RenderableControl);

  const rules: RegisterOptions = useMemo(
    () => ({
      validate: async (value) => {
        if (!schema) {
          return true;
        }
        try {
          await schema.validate(value);
          return true;
        } catch (e: any) {
          return e.errors.join(", ");
        }
      },
    }),
    [schema],
  );

  // set validation errors from the session object
  const { setError, clearErrors } = form;
  const validations = useAttributeValidationErrors(control.attribute);
  useEffect(() => {
    // don't set errors if inlineErrors is false
    if (!inlineErrors) return;

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
    >
      {children}
    </FormField>
  );
};