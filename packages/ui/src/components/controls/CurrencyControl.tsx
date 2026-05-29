import { useTheme } from "@/providers";
import { parseNumericOption } from "@/util";
import type { CurrencyControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { NumberInput } from "../ui/numericalinput";
import { Explanation } from "./Explanation";

export const CurrencyFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<CurrencyControl>();

  const minVal = parseNumericOption(control.min);
  const maxVal = parseNumericOption(control.max);

  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <NumberInput
          value={field.value}
          onChange={(value) => field.onChange(value?.toString() ?? "")}
          disabled={field.disabled || control.readOnly}
          placeholder={t("form.text_placeholder")}
          min={minVal}
          max={maxVal}
          allowDecimals
          startAdornment={control.symbol}
        />
      </FormControl>
      <FormMessage />
    </>
  );
};
