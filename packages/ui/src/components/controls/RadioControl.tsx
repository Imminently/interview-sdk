import type { OptionsControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { useTheme } from "@/providers";
import { FormControl, FormLabel, useFormField } from "../ui/form";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export const RadioFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control, formItemId } = useFormField<OptionsControl>();
  const { options } = control;

  if (!options || options.length === 0) {
    return null; // No options to display
  }

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        <RadioGroup
          value={field.value}
          onValueChange={field.onChange}
          className="flex flex-col"
        >
          {options.map((option) => {
            // generate a unique id for each option, as we need to ensure it doesn't conflict with other controls
            const id = `${formItemId}-${option.value}`;
            return (
              <div className="flex items-center space-x-2" key={id}>
                <RadioGroupItem
                  id={id}
                  value={option.value}
                  disabled={field.disabled}
                />
                <Label htmlFor={id} className="cursor-pointer font-normal">
                  {t(option.label)}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </FormControl>
    </>
  );
};
