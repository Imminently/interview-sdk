import React, { ReactNode } from "react";
import { UseControllerReturn } from "react-hook-form";
import { type Control } from "@imminently/interview-sdk";
import { useTheme } from "@/providers";
import { cn } from "@/util";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";

export const isReadOnly = (control: Control) => {
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

const DEFAULT_RENDER_VALUE = (value: any) => String(value);

// export const ReadOnlyControl = ({ control, renderValue = DEFAULT_RENDER_VALUE }: ReadOnlyControlProps) => {
//   const { t } = useTheme();
//   const id = React.useId();

//   // @ts-ignore
//   const label = t(control.label);
//   // @ts-ignore
//   const value = renderValue(control.value);
//   // @ts-ignore customClassName is on some of the controls
//   const customClass = control.customClassName ?? "";
//   const formItemId = `${id}-form-item`;

//   return (
//     <div data-slot="form-control" id={formItemId} className={cn("flex flex-col gap-2", customClass)}>
//       <div className="flex flex-row gap-2">
//         <Label data-slot="form-label">
//           {label}
//           <Explanation control={control} />
//         </Label>
//         <Text>{value}</Text>
//       </div>
//       {/* {firstValidation && <Error id={control.id} />} */}
//       <Error control={control} />
//     </div>
//   );
// }

export const ReadOnlyControl = ({ field }: UseControllerReturn) => {
  const { t, getControl } = useTheme();
  const { control } = useFormField<Control>();
  const renderValue = getControl('renderValue') ?? DEFAULT_RENDER_VALUE;

  // @ts-ignore
  const label = t(control.label);
  const value = renderValue(field.value) as ReactNode;
  return (
    <>
      <FormLabel>{label}</FormLabel>
      <FormControl>{value}</FormControl>
      <FormMessage />
    </>
  );
};
