import { isValid, parse } from "date-fns";
import z, { type ZodTypeAny } from "zod";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";
import { t } from "../utils/translateFn";
import { InputControl } from "./InputControl";

export const DateControl = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge("DateControl", classNames);
  const { values, setValue, setErrors } = useInterview();
  useFieldRegistration({
    name: control?.attribute,
    defaultValue: control?.default,
    validate: (): ZodTypeAny => {
      let schema: ZodTypeAny = z.date();

      // Required
      if (control?.required) {
        schema = schema.refine((date) => date !== null, {
          message: t("validations.required"),
        });
      }

      // Min date
      if (control?.min) {
        const minDate = new Date(control.min);
        schema = schema.refine((date) => !date || date >= minDate, {
          message: t("validations.min_date", {
            min: minDate.toLocaleDateString(),
          }),
        });
      }

      // Max date
      if (control?.max) {
        const maxDate = new Date(control.max);
        schema = schema.refine((date) => !date || date <= maxDate, {
          message: t("validations.max_date", {
            max: maxDate.toLocaleDateString(),
          }),
        });
      }

      // Not allow future
      if (control?.allow_future === false) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        schema = schema.refine((date) => !date || date <= today, {
          message: t("validations.no_future") || "Date cannot be in the future",
        });
      }

      // Not allow past
      if (control?.allow_past === false) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        schema = schema.refine((date) => !date || date >= today, {
          message: t("validations.no_past") || "Date cannot be in the past",
        });
      }

      return schema;
    },
  });

  if (!control) return null;
  const { attribute, hidden } = control;
  if (hidden) return null;
  const value = (values && values[attribute]) || control.value;

  return (
    <InputControl
      {...control}
      value={value}
      setValue={(attr: string, value: any) => {
        let dateObj: Date | null = null;
        // Try ISO first
        dateObj = parse(value, "yyyy-MM-dd", new Date());
        if (!isValid(dateObj)) {
          // Try browser locale
          const localeDate = new Date(value);
          if (isValid(localeDate)) {
            dateObj = localeDate;
          } else {
            dateObj = null;
          }
        }
        if (dateObj && isValid(dateObj)) {
          setValue(attr, dateObj);
        } else {
          setErrors &&
            setErrors((prev: any) => ({
              ...prev,
              [attr]: [
                {
                  message: t("validations.invalid_date"),
                },
              ],
            }));
        }
      }}
      onBlur={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (value instanceof Date && isValid(value)) {
          e.target.value = value.toLocaleDateString();
        } else {
          e.target.value = "";
        }
      }}
      classNames={mergedClassNames}
    />
  );
};
