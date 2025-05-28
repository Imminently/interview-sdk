import { themeMerge } from "../providers/ThemeProvider";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { z, ZodTypeAny } from "zod";
import { t } from "../utils/translateFn";
import { InputControl } from "./InputControl";


export const TextControl = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge('TextControl', classNames);
  const { values, setValue } = useInterview();


  useFieldRegistration({
    name: control?.attribute,
    defaultValue: control?.default,
    validate:  (): ZodTypeAny => {
      let schema: ZodTypeAny;
    
      // 1. Base type
      if (control.variation === "number") {
        schema = z.number();
      } else if (control.variation === "email") {
        schema = z.string().email(t("validations.email"));
      } else {
        schema = z.string();
      }
    
      
    
      // 3. Max length/Max value
      if (typeof control.max === "number") {
        if (control.variation === "number") {
          schema = (schema as z.ZodNumber).max(control.max, t("validations.max", { max: control.max }));
        } else {
          schema = (schema as z.ZodString).max(control.max, t("validations.max", { max: control.max }));
        }
      }

    
      // 4. Min value (for numbers)
      if (typeof control.min === "number" && control.variation === "number") {
        schema = (schema as z.ZodNumber).min(control.min, t("validations.min", { min: control.min }));
      }
      // 2. Required/Optional
      if (control.required) {
        if (control.variation === "number") {
          // For numbers, required is the default (z.number() is required by default)
          // No need to do anything
        } else {
          schema = (schema as z.ZodString).nonempty(t("validations.required"));
        }
      } else {
        schema = schema.optional();
      }
      if (control.variation === "number") {
        schema = z.preprocess(
          (val) => (val === "" ? undefined : Number(val)),
          schema
        );
      }
    
      return schema;
    },
    visible: !control?.hidden
  });
  if (!control) return null;
  const { attribute, hidden } = control;
  if (hidden) return null;
  let value = (values && values[attribute]) || control.value;

  return <InputControl
    {...control}
    value={value}
    setValue={setValue}
    classNames={mergedClassNames}
  />
 
};