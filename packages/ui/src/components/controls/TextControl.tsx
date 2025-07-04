import { UseControllerReturn } from "react-hook-form";
import { TextControl } from "@imminently/interview-sdk";
import { FormControl, FormLabel, FormMessage, useFormField } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useTheme } from "@/providers";

type NewTextControl = Omit<TextControl, "multi"> & {
  rows?: number;
}

export const TextFormControl = ({ field }: UseControllerReturn) => {
  const { t } = useTheme();
  const { control } = useFormField<NewTextControl>();

  const type = control.variation?.type === "number" ? "number" : "text";
  return (
    <>
      <FormLabel>{t(control.label)}</FormLabel>
      <FormControl>
        {
          control.rows && control.rows > 1 ? (
            <Textarea
              rows={control.rows}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={field.disabled}
              placeholder={t('form.text_placeholder')}
            />
          ) : (
            <Input
              type={type}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={field.disabled}
              placeholder={t('form.text_placeholder')}
            />
          )
        }
      </FormControl>
      <FormMessage />
    </>
  );
}