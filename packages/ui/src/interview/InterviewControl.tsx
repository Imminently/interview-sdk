import type { Control, RenderableControl } from "@imminently/interview-sdk";
import type React from "react";
import { useEffect, useMemo } from "react";
import {
  type RegisterOptions,
  type UseControllerReturn,
  useFormContext,
} from "react-hook-form";
import { isReadOnly } from "@/components/controls/ReadOnlyControl";
import { FormField, FormItem } from "../components/ui/form";
import { MAX_INLINE_LABEL_LENGTH } from "../util";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { generateValidatorForControl } from "../util/validation";
import { useInterview } from "./InterviewContext";

export interface InterviewControlProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
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
  const { readOnly: forceReadOnly, manager } = useInterview();
  const { unregister, ...form } = useFormContext();
  // take a local copy
  // TODO why do some of the controls have booleans listed as type 'true'?
  const resolvedControl: Omit<Control, 'disabled'> & { disabled: boolean, readOnly: boolean } = useMemo(
    () => {
      const readOnly = forceReadOnly || isReadOnly(control);
      return { ...control, readOnly, disabled: readOnly }
    },
    [control, forceReadOnly],
  );
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

  // useEffect(() => {
  //   // if (manager.debug) {
  //   //   console.log("[InterviewControl] Registering control", {
  //   //     name,
  //   //     control: resolvedControl,
  //   //   });
  //   // }

  //   // return a cleanup function to unregister the control
  //   return () => {
  //     if (manager.isOnScreen(resolvedControl as Control)) return; // don't unregister if the control is on screen
  //     // if the control is not on screen, we can safely unregister it
  //     if (manager.debug) {
  //       console.log("[InterviewControl] Unregistering control", name);
  //     }
  //     unregister(name);
  //   };
  // }, [manager, resolvedControl, name, unregister]);

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
  // if (readOnly && (control as any).labelDisplay === "automatic") {
  //   return (
  //     <FormField
  //       name={name}
  //       data={resolvedControl}
  //       control={form.control}
  //       defaultValue={defaultValue}
  //       render={(props) => (
  //         <FormItem>
  //           <ReadOnlyControl {...props} />
  //         </FormItem>
  //       )}
  //     />
  //   );
  // } else if (readOnly) {
  //   // @ts-ignore since its flagged readOnly, we want to force it disabled
  //   resolvedControl.disabled = true;
  // }

  return (
    <FormField
      name={name}
      data={resolvedControl as Control}
      control={form.control}
      defaultValue={defaultValue}
      disabled={resolvedControl.disabled ?? false}
      rules={rules}
      shouldUnregister={true}
      render={(props) => ( // { field, fieldState, formState }
        <FormItem>
          {
            // children({
            //   fieldState,
            //   formState,
            //   field: {
            //     ...field,
            //     // we want to use the control value if we are readOnly, as it might get dynamically updated, which is outisde of the form
            //     // @ts-ignore if value doesn't exist, it'll just use the field value
            //     value: resolvedControl.readOnly && resolvedControl.value ? resolvedControl.value : field.value
            //   }
            // })
            children(props)
          }
        </FormItem>
      )}
    />
  );
};
