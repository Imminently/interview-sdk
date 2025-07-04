import { UseControllerReturn } from "react-hook-form";
import { OptionsControl } from "@imminently/interview-sdk";
import { FormControl, FormLabel, useFormField } from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useTheme } from "@/providers";

export const RadioFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<OptionsControl>();
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
          {
            options.map((option) => (
              <div className="flex items-center space-x-2" key={option.value}>
                <RadioGroupItem
                  id={option.value}
                  value={option.value}
                  disabled={field.disabled}
                />
                <Label htmlFor={option.value} className="cursor-pointer font-normal">
                  {t(option.label)}
                </Label>
              </div>
            ))
          }
        </RadioGroup>
      </FormControl>
    </>
  );
}