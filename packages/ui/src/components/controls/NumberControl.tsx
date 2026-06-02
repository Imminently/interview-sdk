import { useTheme } from "@/providers";
import { getNumericalStep, parseNumericOption } from "@/util";
import type { NumberControl } from "@imminently/interview-sdk";
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

export const parseNumberControl = (control: NumberControl): NumberControl => ({
  ...control,
  value: toNum(control.value),
  default: toNum(control.default),
});

export const NumberFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NumberControl>();

  const step = getNumericalStep(control.numericalOptions);
  const minVal = parseNumericOption(control.numericalOptions?.min);
  const maxVal = parseNumericOption(control.numericalOptions?.max);
  const maxDecimalPlacesVal = parseNumericOption(control.numericalOptions?.maxDecimalPlaces);

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        <NumberInput
          value={field.value}
          onChange={(value) => field.onChange(value ?? "")}
          disabled={field.disabled || control.readOnly}
          placeholder={t("form.text_placeholder")}
          min={minVal}
          max={maxVal}
          allowDecimals={control.numericalOptions?.allowDecimals}
          maxDecimalPlaces={maxDecimalPlacesVal}
          step={step}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};


