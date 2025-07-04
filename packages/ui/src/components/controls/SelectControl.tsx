import { UseControllerReturn } from "react-hook-form";
import { OptionsControl } from "@imminently/interview-sdk";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { useTheme } from "@/providers";

export const SelectFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();
  const { options } = control;

  return (
    <>
      <FormLabel>
        {t(control.label)}
      </FormLabel>
      <Select
        name={field.name}
        value={field.value}
        onValueChange={field.onChange}
        disabled={options?.length === 0 || field.disabled}
      >
        <FormControl>
          <SelectTrigger className="w-full">
            {
              t(field.value
                ? options?.find((option) => option.value === field.value)?.label
                : "form.select_placeholder")
            }
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </>
  );
}