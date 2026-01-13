import { useTheme } from "@/providers";
import type { OptionsControl } from "@imminently/interview-sdk";
import type { UseControllerReturn } from "react-hook-form";
import { FormControl, FormLabel, useFormField } from "../ui/form";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "@/util";

const parse = (v: string) => {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  return v;
};

export const parseRadioControl = (control: OptionsControl) => {
  // we need to convert any 'null' string values to actual null values
  // NOTE we don't want to change the options, as that will be handled in the control
  // All options must be a string
  const parsedControl: OptionsControl = {
    ...control,
    default: control.default === "null" ? null : control.default,
    value: control.value === "null" ? null : control.value,
  };
  return parsedControl;
};

export const RadioFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control, formItemId } = useFormField<OptionsControl>();
  const { options } = control;

  if (!options || options.length === 0) {
    return null; // No options to display
  }

  const handleChange = (value: string) => {
    field.onChange(parse(value));
  }

  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        <RadioGroup
          disabled={field.disabled || control.readOnly}
          value={field.value !== undefined ? String(field.value) : ""}
          onValueChange={handleChange}
          className="flex flex-col"
        >
          {options.map((option) => {
            // generate a unique id for each option, as we need to ensure it doesn't conflict with other controls
            const id = `${formItemId}-${option.value}`;
            const optionValue = String(option.value);
            const fieldValue = field.value !== undefined ? String(field.value) : "";
            const isSelected = fieldValue === optionValue;

            return (
              <div
                className="flex items-center space-x-2"
                key={id}
              >
                <RadioGroupItem
                  id={id}
                  value={option.value ?? ""}
                  // disabled={field.disabled || control.readOnly}
                />
                <Label
                  htmlFor={id}
                  className={cn(
                    "font-normal",
                    control.readOnly
                      ? "cursor-default text-foreground"
                      : "cursor-pointer",
                    control.readOnly && isSelected && "font-medium"
                  )}
                >
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
