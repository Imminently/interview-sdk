import React, { useMemo } from "react";
import { RegisterOptions, useController, UseControllerReturn, useFormContext } from "react-hook-form";
import { type Control } from "@imminently/interview-sdk";
import { Error } from "../components/controls/Error";
import { MAX_INLINE_LABEL_LENGTH } from "../util";
import { useAttributeToFieldName } from "../util/attribute-to-field-name";
import { generateValidatorForControl } from "../util/Validation";
import { Explanation } from "../components/controls/Explanation";
import Text from "../components/ui/text";
import { FormField, FormItem } from "../components/ui/form";
import { SlotProps } from "@radix-ui/react-slot";

export interface FormControlError {
  message: string;
}

// function Slot<P = React.HTMLAttributes<HTMLElement>>(props: SlotProps & P) {
//   return <ReactSlot {...props} />;
// }

export type InterviewControlSlot<C extends Control, P = React.HTMLAttributes<HTMLElement>> = React.ComponentType<{
  control: C;
} & ReturnType<typeof useController> & SlotProps & P>;

export interface InterviewControlProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  control: Control;
  renderValue?: (value: string) => React.ReactNode;
  children: (props: UseControllerReturn) => React.ReactElement;
  // slot: InterviewControlSlot<Control>;
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

// type ReadOnlyBasedMeta =
//   | { type: "hasNoEffect" }
//   | {
//     type: "markControlDisabled";
//     ctrlWithDisabledTrue: Control;
//   }
//   | { type: "overrideRender"; node: React.ReactNode };

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
  // const { attribute } = control;
  // const interview = useInterview();
  // const { getValues } = useFormContext();

  // const pathedAttribute = attributeToPath(attribute, interview.session.data, getValues(), false);
  // const validations = interview.session.validations
  //   ?.filter((v) => v.shown && v.attributes.includes(pathedAttribute as string))
  //   .sort((a, b) => a.attributes.length - b.attributes.length);
  // const firstValidation = validations?.[0];

  // @ts-ignore
  const label = control.label;
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

  // og
  // return (
  //   <div className="flex flex-row gap-2">
  //          <Text>{label}</Text>
  //         <Text>{renderValue(String(controlLocal.value))}</Text>
  //        <Explanation control={control} />
  //       </div>
  // )
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
  const defaultValue = resolvedControl.value ?? resolvedControl.default;
  // console.log(`[Control::${control.type}] defaultValue`, defaultValue, control);
  // const label = "label" in resolvedControl ? resolvedControl.label : undefined;
  const rules: RegisterOptions = {
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
  };

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
