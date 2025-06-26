import { OptionsControl } from "@core";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormLabel, FormMessage } from "../ui/form";

export const SelectFormControl = ({ control }: { control: OptionsControl }) => {
  const { options } = control;
  if (!options || options.length === 0) {
    return null; // No options to display
  }
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            disabled={field.disabled}
          >
            <FormLabel>
              {control.label}
            </FormLabel>
            <SelectTrigger className="w-full">
              {field.value
                ? options.find((option) => option.value === field.value)?.label
                : "Select an option"}
            </SelectTrigger>
            <FormMessage />
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }}
    </InterviewControl>
  )
}