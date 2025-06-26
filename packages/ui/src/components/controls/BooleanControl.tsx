import { UseControllerReturn } from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { Explanation } from "./Explanation";
import { InterviewControl } from "@/ui/interview/InterviewControl";
import { FormControl, FormDescription, FormLabel, FormMessage, useFormField } from "../ui/form";
import { BooleanControl } from "@/core";
import { useTheme } from "@/ui/providers/ThemeProvider";

const DefaultBooleanControl = ({ field }: UseControllerReturn) => {
  const { value, onChange } = field;
  const { control } = useFormField<BooleanControl>();

  return (
    <>
      <FormLabel>
        <FormControl>
          <Checkbox
            checked={value === true}
            onCheckedChange={(val: boolean) => onChange(val)}
            disabled={control.readOnly ?? control.disabled}
            aria-label={control.label}
          />
        </FormControl>
        {control.label}
        <Explanation control={control} />
      </FormLabel>
      <FormDescription />
      <FormMessage />
    </>
  );
};

export const BooleanFormControl = ({ control }: any) => {
  const { getControl } = useTheme();
  const Comp = getControl(control.type) ?? DefaultBooleanControl;
  return (
    <InterviewControl control={control}>
      {(props) => <Comp {...props} />}
    </InterviewControl>
  )
}