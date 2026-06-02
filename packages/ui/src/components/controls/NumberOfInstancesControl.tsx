import { useTheme } from "@/providers";
import { parseNumericOption } from "@/util";
import type { NumberOfInstancesControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { NumberInput } from "../ui/numericalinput";

const toNum = (v: any): number | null | undefined => {
  if (v === null) return null;
  if (v === undefined) return undefined;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

export const parseNumberOfInstancesControl = (control: NumberOfInstancesControl): NumberOfInstancesControl => ({
  ...control,
  // The form field holds the count as a number; coerce in case the backend sends a string
  value: toNum(control.value as any) as any,
  default: toNum(control.default as any) as any,
});

export const NumberOfInstancesFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NumberOfInstancesControl>();

  return (
    <>
      {control.label ? <FormLabel>{t(control.label)}</FormLabel> : null}
      <FormControl>
        <NumberInput
          value={field.value}
          onChange={(value) => field.onChange(value ?? "")}
          disabled={field.disabled || control.readOnly}
          placeholder={t("form.text_placeholder")}
          min={parseNumericOption(control.min) ?? 0}
          max={parseNumericOption(control.max)}
          allowDecimals={false}
          step={1}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};

export default NumberOfInstancesFormControl;