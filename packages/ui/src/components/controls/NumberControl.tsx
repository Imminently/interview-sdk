import { useTheme } from "@/providers";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { NumberInput } from "../ui/numericalinput";
import type { NumberControl } from "@imminently/interview-sdk";

export const NumberFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NumberControl>();

  const step = (() => {
    const no = control?.numericalOptions || {};
    if (no && no.allowDecimals === false) return 1;

    const hasMinMax = typeof no?.min === "number" && typeof no?.max === "number";
    if (hasMinMax) {
      const range = (no.max as number) - (no.min as number);
      if (range < 1) {
        const mdp = Number(no.maxDecimalPlaces);
        if (Number.isFinite(mdp)) {
          return 10 ** -Math.max(0, mdp);
        }
        return 0.1;
      }
    }

    return 1;
  })();

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        <NumberInput
          value={typeof field.value === "number" ? field.value : field.value ? Number(field.value) : undefined}
          onChange={(value) => field.onChange(value ?? "")}
          disabled={field.disabled || control.readOnly}
          placeholder={t("form.text_placeholder")}
          min={control.numericalOptions?.min}
          max={control.numericalOptions?.max}
          allowDecimals={control.numericalOptions?.allowDecimals}
          maxDecimalPlaces={control.numericalOptions?.maxDecimalPlaces}
          step={step}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};


