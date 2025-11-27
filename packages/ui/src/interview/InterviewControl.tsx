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
// import directly to avoid circular dependency
import { parseControl } from "@/components/parseControl";

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
// const getControlDefault = (type: string) => {
//   switch (type) {
//     case "boolean":
//       return undefined; // use undefined as we support indeterminate state
//     // case "currency":
//     // return 0;
//     // case "text":
//     // case "number_of_instances":
//     // case "date":
//     // case "datetime":
//     // case "time":
//     // return "";
//     default:
//       return undefined;
//   }
// };

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
    return parseControl({ ...control, readOnly, disabled: readOnly });
  }, [control]);
  // @ts-ignore
  const name: string = useAttributeToFieldName(attribute) ?? control.entity;

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
  const defaultValue =
    // @ts-ignore
    resolvedControl.value ??
    // @ts-ignore
    resolvedControl.default ??
    (_experimental_strictMode ? null : undefined);

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
