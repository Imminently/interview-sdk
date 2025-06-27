import { OptionsControl } from "@imminently/interview-sdk";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormControl, FormLabel } from "../ui/form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

export const RadioFormControl = ({ control }: { control: OptionsControl }) => {
  const { options } = control;
  if (!options || options.length === 0) {
    return null; // No options to display
  }
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <>
            <FormLabel>{control.label}</FormLabel>
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
                        {option.label}
                      </Label>

                    </div>
                  ))
                }
              </RadioGroup>
            </FormControl>
          </>
        );
      }}
    </InterviewControl>
  )
}