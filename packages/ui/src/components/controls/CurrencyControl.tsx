import { UseControllerReturn } from "react-hook-form";
import { CurrencyControl } from "@imminently/interview-sdk";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Input } from "../ui/input";
import { Explanation } from "./Explanation";
import { useTheme } from "@/providers";

export const CurrencyFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<CurrencyControl>();
  return (
    <>
      <FormLabel>
        {t(control.label)}
        <Explanation control={control} />
      </FormLabel>
      <FormControl>
        <div className="relative flex items-center rounded-md border focus-within:ring-1 focus-within:ring-ring pl-2">
          <span className="text-muted-foreground">{control.symbol}</span>
          <Input
            type={control.type}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            disabled={field.disabled}
            className="border-0 focus-visible:ring-0 shadow-none"
          />
        </div>
      </FormControl>
      <FormMessage />
    </>
  );
}