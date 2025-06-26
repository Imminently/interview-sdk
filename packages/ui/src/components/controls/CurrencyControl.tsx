import { CurrencyControl } from "@core";
import { InterviewControl } from "@/interview/InterviewControl";
import { FormControl, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Explanation } from "./Explanation";

export const CurrencyFormControl = ({ control }: { control: CurrencyControl }) => {
  return (
    <InterviewControl control={control}>
      {({ field }) => {
        return (
          <>
            <FormLabel>
              {control.label}
              <Explanation control={control} />
            </FormLabel>
            <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring pl-2">
              <span className="text-muted-foreground">{control.symbol}</span>
              <FormControl>
                <Input
                  type={control.type}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={field.disabled}
                  className="border-0 focus-visible:ring-0 shadow-none"
                />
              </FormControl>
            </div>
            <FormMessage />
          </>
        );
      }}
    </InterviewControl>
  )
}