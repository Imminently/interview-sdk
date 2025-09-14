import { useTheme } from "@/providers";
import type { Control } from "@imminently/interview-sdk";
import type { ReactNode } from "react";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Explanation } from "./Explanation";

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
    control.type !== "text" &&
    control.type !== "file" &&
    control.type !== "number"
  ) {
    return false;
  }
  // return readOnly property if it exists, otherwise return false
  return control.readOnly ?? false;
};

/** Defaul render simply tries to render a string. Note it must be within a span so the FormControl works. */
const DEFAULT_RENDER_VALUE = (value: unknown) => <span>{String(value)}</span>;

export const ReadOnlyControl = ({ field }: UseControllerReturn) => {
  const { t, getControl } = useTheme();
  const { control } = useFormField<Control>();
  const renderValue = getControl("renderValue") ?? DEFAULT_RENDER_VALUE;

  // @ts-ignore
  const label = t(control.label);
  const value = renderValue(field.value) as ReactNode;
  return (
    <>
      <FormLabel>
        {label}
        <Explanation control={control} />
      </FormLabel>
      <FormControl aria-readonly>{value}</FormControl>
      <FormMessage />
    </>
  );
};
