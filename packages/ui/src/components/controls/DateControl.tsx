import { UseControllerReturn } from "react-hook-form";
import { DateControl } from "@imminently/interview-sdk";
import { useTheme } from "@/providers";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { DatePicker } from "../ui/date-picker";

export const DateFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<DateControl>();
  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        <DatePicker
          value={field.value}
          onChange={field.onChange}
          disabled={field.disabled}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};

