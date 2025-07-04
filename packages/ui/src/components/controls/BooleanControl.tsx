import { UseControllerReturn } from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { Explanation } from "./Explanation";
import { FormControl, FormDescription, FormLabel, FormMessage, useFormField } from "../ui/form";
import { BooleanControl } from "@imminently/interview-sdk";
import { useTheme } from "@/providers";

export const BooleanFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<BooleanControl>();

  return (
    <>
      <FormLabel>
        <FormControl>
          <Checkbox
            checked={field.value === undefined ? 'indeterminate' : field.value}
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