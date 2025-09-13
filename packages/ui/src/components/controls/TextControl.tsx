import { useTheme } from "@/providers";
import type { TextControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Input } from "../ui/input";
import { NumberInput } from "../ui/numericalinput";
import { Textarea } from "../ui/textarea";

type NewTextControl = Omit<TextControl, "multi"> & {
  rows?: number;
  numericalOptions?: {
    /** The minimum numeric value allowed */
    min?: number;
    /** The maximum numeric value allowed */
    max?: number;
    /** Whether decimal values are allowed (false means integers only) */
    allowDecimals?: boolean;
    /** If decimals are allowed, restrict to this many decimal places */
    maxDecimalPlaces?: number;
  };
};

export const TextFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NewTextControl>();

  const type = control.variation?.type === "number" ? "number" : "text";
  const isNumberType = type === "number";

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
        {control.rows && control.rows > 1 ? (
          <Textarea
            rows={control.rows}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={field.disabled}
            placeholder={t("form.text_placeholder")}
          />
        ) : isNumberType ? (
          <NumberInput
            value={field.value ? Number(field.value) : undefined}
            onChange={(value) => field.onChange(value?.toString() ?? "")}
            disabled={field.disabled}
            placeholder={t("form.text_placeholder")}
            min={control.numericalOptions?.min}
            max={control.numericalOptions?.max}
            allowDecimals={control.numericalOptions?.allowDecimals}
            maxDecimalPlaces={control.numericalOptions?.maxDecimalPlaces}
            step={step}
          />
        ) : (
          <Input
            type={type}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={field.disabled}
            placeholder={t("form.text_placeholder")}
          />
        )}
      </FormControl>
      <FormMessage />
    </>
  );
};
