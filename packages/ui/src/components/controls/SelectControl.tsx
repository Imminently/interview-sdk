import { useTheme } from "@/providers";
import type { OptionsControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

export const SelectFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();
  const { options } = control;

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <Select
        name={field.name}
        value={field.value}
        onValueChange={control.readOnly ? undefined : field.onChange}
        disabled={options?.length === 0 || field.disabled || control.readOnly}
      >
        <FormControl>
          <SelectTrigger className={`w-full ${control.readOnly ? 'cursor-default' : ''}`}>
            {t(
              field.value ? options?.find((option) => option.value === field.value)?.label : "form.select_placeholder",
            )}
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </>
  );
};
