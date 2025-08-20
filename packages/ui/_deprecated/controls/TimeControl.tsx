import z, { type ZodTypeAny } from "zod";
import { useFieldRegistration, useInterview } from "../providers/InterviewProvider";
import { themeMerge } from "../providers/ThemeProvider";
import { t } from "../utils/translateFn";
import { InputControl } from "./InputControl";

// Helper to parse time string to {h, m, s}
function parseTimeString(str: string): { h: number; m: number; s: number } | null {
  if (!str) return null;
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = match[3] ? Number(match[3]) : 0;
  if (h > 23 || m > 59 || s > 59) return null;
  return { h, m, s };
}

// Helper to convert time to minutes since midnight
function timeToMinutes({ h, m, s }: { h: number; m: number; s: number }) {
  return h * 60 + m + s / 60;
}

// Helper to format time string
function formatTime({ h, m, s }: { h: number; m: number; s: number }, format: 12 | 24) {
  if (format === 12) {
    const period = h >= 12 ? "PM" : "AM";
    let hour = h % 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}${s ? ":" + s.toString().padStart(2, "0") : ""} ${period}`;
  } else {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}${s ? ":" + s.toString().padStart(2, "0") : ""}`;
  }
}

// Helper to coerce between 12/24 hour
function coerceTimeFormat(str: string, format: 12 | 24) {
  const t = parseTimeString(str);
  if (!t) return null;
  if (format === 12) {
    // If hour > 12, convert to 12-hour
    return formatTime(t, 12);
  } else {
    // If AM/PM present, convert to 24-hour
    const ampm = str.match(/am|pm/i);
    if (ampm) {
      let hour = t.h;
      if (/pm/i.test(ampm[0]) && hour < 12) hour += 12;
      if (/am/i.test(ampm[0]) && hour === 12) hour = 0;
      return formatTime({ h: hour, m: t.m, s: t.s }, 24);
    }
    return formatTime(t, 24);
  }
}

// Helper to format raw digits into time string
function formatRawDigits(digits: string): string | null {
  // Remove any non-digit characters
  const cleanDigits = digits.replace(/\D/g, "");

  if (cleanDigits.length < 3) return null;

  // Parse hours and minutes
  let hours = Number.parseInt(cleanDigits.slice(0, -2));
  let minutes = Number.parseInt(cleanDigits.slice(-2));

  // Handle single digit hours (e.g., "100" -> "1:00")
  if (cleanDigits.length === 3) {
    hours = Number.parseInt(cleanDigits[0]);
    minutes = Number.parseInt(cleanDigits.slice(1));
  }

  // Validate hours and minutes
  if (hours > 23 || minutes > 59) return null;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export const TimeControl = (props: any) => {
  const { control, classNames } = props;
  const mergedClassNames = themeMerge("TimeControl", classNames);
  const { values, setValue, setErrors } = useInterview();
  useFieldRegistration({
    name: control?.attribute,
    defaultValue: control?.default,
    validate: (): ZodTypeAny => {
      let schema: ZodTypeAny = z.string().refine(
        (val) => {
          if (!val) return !control?.required;
          const t = parseTimeString(val);
          if (!t) return false;
          // Min time
          if (control?.min) {
            const minT = parseTimeString(control.min);
            if (minT && timeToMinutes(t) < timeToMinutes(minT)) return false;
          }
          // Max time
          if (control?.max) {
            const maxT = parseTimeString(control.max);
            if (maxT && timeToMinutes(t) > timeToMinutes(maxT)) return false;
          }
          return true;
        },
        {
          message: t("validations.invalid_time"),
        },
      );
      if (control?.required) {
        schema = schema.refine((val) => !!val, {
          message: t("validations.required"),
        });
      }
      return schema;
    },
  });

  if (!control) return null;
  const { attribute, hidden } = control;
  if (hidden) return null;
  const value = (values && values[attribute]) || control.value || "";

  return (
    <InputControl
      {...control}
      value={value}
      setValue={(attr: string, val: any) => {
        let str = String(val || "").trim();

        // If input contains a colon, use existing parsing
        if (str.includes(":")) {
          const enough = /\d{2}:\d{2}/.test(str);
          if (!enough) {
            setValue(attr, str);
            return;
          }
          const tParsed = parseTimeString(str);
          if (!tParsed) {
            setErrors &&
              setErrors((prev: any) => ({
                ...prev,
                [attr]: [{ message: t("validations.invalid_time") }],
              }));
            setValue(attr, str);
            return;
          }
          // Coerce format if needed
          if (control.format === 12 || control.format === 24) {
            const coerced = coerceTimeFormat(str, control.format);
            if (!coerced) {
              setErrors &&
                setErrors((prev: any) => ({
                  ...prev,
                  [attr]: [{ message: t("validations.invalid_time") }],
                }));
              setValue(attr, val);
              return;
            }
            str = coerced;
          }
        } else {
          // Handle raw digits input
          const formatted = formatRawDigits(str);
          if (formatted) {
            str = formatted;
            // Coerce format if needed
            if (control.format === 12 || control.format === 24) {
              const coerced = coerceTimeFormat(str, control.format);
              if (coerced) {
                str = coerced;
              }
            }
          }
        }

        setValue(attr, str);
      }}
      onBlur={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.target.value = value || "";
      }}
      classNames={mergedClassNames}
    />
  );
};
