import { OptionsControl } from "@imminently/interview-sdk";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormControl, FormLabel, FormMessage } from "../ui/form";

export const SelectFormControl = ({ control }: { control: OptionsControl }) => {
  const { options } = control;
  if (!options || options.length === 0) {
    return null; // No options to display
  }
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <>
            <FormLabel>
              {control.label}
            </FormLabel>
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              disabled={field.disabled}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  {field.value
                    ? options.find((option) => option.value === field.value)?.label
                    : "Select an option"}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </>
        );
      }}
    </InterviewControl>
  )
}