import { useTheme } from "@/providers";
import { getNumericalStep, parseNumericOption } from "@/util";
import type { NumberControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { NumberInput } from "../ui/numericalinput";

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


