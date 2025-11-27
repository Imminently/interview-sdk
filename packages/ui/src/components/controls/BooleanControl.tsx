import { useTheme } from "@/providers";
import type { BooleanControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { FormControl, FormDescription, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Explanation } from "./Explanation";

export const BooleanFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<BooleanControl>();

  return (
    <>
      <FormLabel className="cursor-pointer">
        <FormControl>
          <Checkbox
            checked={field.value === undefined || field.value === null ? "indeterminate" : field.value}
            onCheckedChange={(val: boolean) => field.onChange(val)}
            disabled={control.readOnly ?? control.disabled}
            aria-label={control.label}
          />
        </FormControl>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormDescription />
      <FormMessage />
    </>
  );
};
