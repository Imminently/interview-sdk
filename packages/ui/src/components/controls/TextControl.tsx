import { useTheme } from "@/providers";
import { getNumericalStep, parseNumericOption } from "@/util";
import type { NumericalOptions } from "@/util";
import type { TextControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Input } from "../ui/input";
import { NumberInput } from "../ui/numericalinput";
import { Textarea } from "../ui/textarea";

type NewTextControl = Omit<TextControl, "multi"> & {
  rows?: number;
  numericalOptions?: NumericalOptions;
};

export const TextFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NewTextControl>();

  const type = control.variation?.type === "number" ? "number" : "text";
  const isNumberType = type === "number";

  const minVal = parseNumericOption(control.numericalOptions?.min);
  const maxVal = parseNumericOption(control.numericalOptions?.max);
  const maxDecimalPlacesVal = parseNumericOption(control.numericalOptions?.maxDecimalPlaces);
  const step = getNumericalStep(control.numericalOptions);

  const disabled = field.disabled || control.readOnly;

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        {control.rows && control.rows > 1 ? (
          <Textarea
            rows={control.rows}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={disabled}
            placeholder={t("form.text_placeholder")}
          />
        ) : isNumberType ? (
          <NumberInput
            value={field.value}
            onChange={(value) => field.onChange(value?.toString() ?? "")}
            disabled={disabled}
            placeholder={t("form.text_placeholder")}
            min={minVal}
            max={maxVal}
            allowDecimals={control.numericalOptions?.allowDecimals}
            maxDecimalPlaces={maxDecimalPlacesVal}
            step={step}
          />
        ) : (
          <Input
            type={type}
            value={field.value ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={disabled}
            placeholder={t("form.text_placeholder")}
          />
        )}
      </FormControl>
      <FormMessage />
    </>
  );
};
