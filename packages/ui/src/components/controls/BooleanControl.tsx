import { useTheme } from "@/providers";
import type { BooleanControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { FormControl, FormDescription, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Explanation } from "./Explanation";

export const toBool = (v: any): boolean | null | undefined => {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1 || v === "1") return true;
  if (v === "false" || v === 0 || v === "0") return false;
  return v;
};

export const parseBooleanControl = (control: BooleanControl): BooleanControl => ({
  ...control,
  value: toBool(control.value),
  default: toBool(control.default),
});

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
            disabled={control.readOnly || control.disabled}
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
