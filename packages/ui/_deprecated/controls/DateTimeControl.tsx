import clsx from "clsx";
import { format, isValid, parse } from "date-fns";
import { useEffect, useRef, useState } from "react";
import z, { type ZodTypeAny } from "zod";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";
import { t } from "../utils/translateFn";
import { Error } from "./Error";
import { Explanation } from "./Explanation";

// Helper to split datetime into date and time strings
function splitDateTime(date: Date | null): { date: string; time: string } {
  if (!date || !isValid(date)) {
    return { date: "", time: "" };
  }
  return {
    date: format(date, "yyyy-MM-dd"),
    time: format(date, "HH:mm"),
  };
}

// Helper to combine date and time strings into a Date
function combineDateTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  const dateObj = parse(dateStr, "yyyy-MM-dd", new Date());
  if (!isValid(dateObj)) return null;

  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) return null;

  dateObj.setHours(hours, minutes, 0, 0);
  return dateObj;
}

// Helper to convert time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export const DateTimeControl = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge("DateTimeControl", classNames);
  const { values, setValue, setErrors } = useInterview();
  const [localDate, setLocalDate] = useState("");
  const [localTime, setLocalTime] = useState("");

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

      // Date constraints
      if (control?.date_min) {
        const minDate = new Date(control.date_min);
        minDate.setHours(0, 0, 0, 0);
        schema = schema.refine((date) => !date || date >= minDate, {
          message: t("validations.min_date", {
            min: minDate.toLocaleDateString(),
          }),
        });
      }

      if (control?.date_max) {
        const maxDate = new Date(control.date_max);
        maxDate.setHours(23, 59, 59, 999);
        schema = schema.refine((date) => !date || date <= maxDate, {
          message: t("validations.max_date", {
            max: maxDate.toLocaleDateString(),
          }),
        });
      }

      // Time constraints
      if (control?.time_min || control?.time_max) {
        schema = schema.refine(
          (date) => {
            if (!date) return true;
            const timeStr = format(date, "HH:mm");
            const minutes = timeToMinutes(timeStr);

            if (control?.time_min) {
              const minMinutes = timeToMinutes(control.time_min);
              if (minutes < minMinutes) return false;
            }

            if (control?.time_max) {
              const maxMinutes = timeToMinutes(control.time_max);
              if (minutes > maxMinutes) return false;
            }

            return true;
          },
          {
            message: t("validations.invalid_time_range", {
              min: control?.time_min || "midnight",
              max: control?.time_max || "midnight",
            }),
          },
        );
      }

      // Not allow future
      if (control?.allow_future === false) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        schema = schema.refine((date) => !date || date <= today, {
          message: t("validations.no_future"),
        });
      }

      // Not allow past
      if (control?.allow_past === false) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        schema = schema.refine((date) => !date || date >= today, {
          message: t("validations.no_past"),
        });
      }

      return schema;
    },
  });

  if (!control) return null;
  const { attribute, hidden, label, labelDisplay, readOnly, showExplanation } = control;
  if (hidden) return null;

  const value = (values && values[attribute]) || control.value;
  const { date, time } = splitDateTime(value);

  // Initialize local state from value if not already set
  useEffect(() => {
    if (value && !localDate && !localTime) {
      setLocalDate(date);
      setLocalTime(time);
    }
  }, [value, date, time]);

  const handleChange = (newDate: string, newTime: string) => {
    // Update local state immediately
    setLocalDate(newDate);
    setLocalTime(newTime);

    // If we have a date but no time, use time_min or midnight as default
    const timeToUse = newTime || control.time_min || "00:00";
    const combinedDate = combineDateTime(newDate, timeToUse);

    if (combinedDate && isValid(combinedDate)) {
      // Only commit if all validations pass
      setValue(attribute, combinedDate);
    } else {
      // Clear the value but keep local state
      setValue(attribute, null);
      setErrors &&
        setErrors((prev: any) => ({
          ...prev,
          [attribute]: [
            {
              message: t("validations.invalid_datetime"),
            },
          ],
        }));
    }
  };

  const handleBlur = () => {
    // On blur, if we have a valid value in the provider, use that
    // Otherwise keep the local state
    if (value) {
      setLocalDate(date);
      setLocalTime(time);
    }
  };

  const inputClassNames = clsx("dcsvly-ctrl-datetime-input-seperate", mergedClassNames.inputSeperate);

  return (
    <>
      <div className={clsx("dcsvly-ctrl-datetime-container", mergedClassNames.container)}>
        <label className={clsx("dcsvly-ctrl-datetime-label-seperate", mergedClassNames.labelSeperate)}>{label}</label>
        <div className={clsx("dcsvly-ctrl-datetime-inputs", mergedClassNames.inputs)}>
          <input
            type="date"
            id={`${attribute}-date`}
            name={`${attribute}-date`}
            className={clsx(inputClassNames, mergedClassNames.dateInput)}
            value={localDate}
            onChange={(e) => handleChange(e.target.value, localTime)}
            onBlur={handleBlur}
            disabled={readOnly}
            placeholder=" "
            autoComplete="off"
          />
          <input
            type="time"
            id={`${attribute}-time`}
            name={`${attribute}-time`}
            className={clsx(inputClassNames, mergedClassNames.timeInput)}
            value={localTime}
            onChange={(e) => handleChange(localDate, e.target.value)}
            onBlur={handleBlur}
            disabled={readOnly}
            placeholder=" "
            autoComplete="off"
          />
        </div>
        <Explanation
          control={{
            showExplanation,
            attribute,
          }}
        />
      </div>
      <Error id={attribute} />
    </>
  );
};
