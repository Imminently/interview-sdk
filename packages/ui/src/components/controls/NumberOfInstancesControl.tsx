import { useTheme } from "@/providers";
import { parseNumericOption } from "@/util";
import type { NumberOfInstancesControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { NumberInput } from "../ui/numericalinput";

export const NumberOfInstancesFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NumberOfInstancesControl>();

  return (
    <>
      {control.label ? <FormLabel>{t(control.label)}</FormLabel> : null}
      <FormControl>
        <NumberInput
          value={typeof field.value === "number" ? field.value : field.value ? Number(field.value) : undefined}
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