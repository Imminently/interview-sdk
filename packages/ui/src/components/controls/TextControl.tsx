import { TextControl } from "@imminently/interview-sdk";
import { InterviewControl } from "@//interview/InterviewControl";
import { FormControl, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type NewTextControl = Omit<TextControl, "multi"> & {
  rows?: number;
}

export const TextFormControl = ({ control }: { control: NewTextControl }) => {
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        const type = control.variation?.type === "number" ? "number" : "text";
        return (
          <>
            <FormLabel>{control.label}</FormLabel>
            <FormControl>
              {
                control.rows && control.rows > 1 ? (
                  <Textarea
                    rows={control.rows}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={field.disabled}
                    placeholder={"Enter text here..."}
                  />
                ) : (
                  <Input
                    type={type}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={field.disabled}
                    placeholder={"Enter text here..."}
                  />
                )
              }
            </FormControl>
            <FormMessage />
          </>
        );
      }}
    </InterviewControl>
  )
}