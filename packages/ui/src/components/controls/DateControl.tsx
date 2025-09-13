import { useTheme } from "@/providers";
import type { DateControl, DateControlThreeVariantDate } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { DatePicker } from "../ui/date-picker";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Explanation } from "./Explanation";

const defaultFormatter = (date: Date) => {
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  // NOTE do NOT use date.toISOString() as that converts to UTC and may change the day
  return `${year}-${month}-${day}`;
}

const getDateFromVariant = (value?: DateControlThreeVariantDate): Date | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") {
    // check if special value of "now"
    if (value.toLowerCase().trim() === "now") {
      return new Date();
    }
    // assume YYYY-MM-DD
    return new Date(value);
  }
  // TODO how do we want to handle warnings
  console.warn("Unexpected date variant value", value);
  return undefined;
};

export const DateFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<DateControl>();

  const minDate = control.min ? getDateFromVariant(control.min) : undefined;
  const maxDate = control.max ? getDateFromVariant(control.max) : undefined;

  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <DatePicker
          value={field.value}
          onChange={(d) => field.onChange(d ? defaultFormatter(d) : undefined)}
          disabled={field.disabled}
          minDate={minDate}
          maxDate={maxDate}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};
