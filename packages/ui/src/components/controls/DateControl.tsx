import { DateControl } from "@core";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormControl, FormLabel, FormMessage } from "../ui/form";
import { DatePicker } from "../ui/date-picker";

export const DateFormControl = ({ control }: { control: DateControl }) => {
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <>
            <FormLabel>{control.label}</FormLabel>
            <FormControl>
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                disabled={field.disabled}
              />
            </FormControl>
            <FormMessage />
          </>
        );
      }}
    </InterviewControl>
  );
};

