import { InterviewControl } from "@//interview/InterviewControl";
import { TimeControl } from "@imminently/interview-sdk";
import { Time } from "../ui/time";
import { FormControl, FormLabel, FormMessage } from "../ui/form";
import { Explanation } from "./Explanation";

// Helper to parse time string to {h, m, s}
function parseTimeString(str: string): { h: number; m: number; s: number } | null {
  if (!str) return null;
  const match = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  let h = Number(match[1]);
  let m = Number(match[2]);
  let s = match[3] ? Number(match[3]) : 0;
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
  let t = parseTimeString(str);
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
  const cleanDigits = digits.replace(/\D/g, '');

  if (cleanDigits.length < 3) return null;

  // Parse hours and minutes
  let hours = parseInt(cleanDigits.slice(0, -2));
  let minutes = parseInt(cleanDigits.slice(-2));

  // Handle single digit hours (e.g., "100" -> "1:00")
  if (cleanDigits.length === 3) {
    hours = parseInt(cleanDigits[0]);
    minutes = parseInt(cleanDigits.slice(1));
  }

  // Validate hours and minutes
  if (hours > 23 || minutes > 59) return null;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//             let newValue = e.target.value;
//             if (format === 12 || format === 24) {
//               newValue = coerceTimeFormat(newValue, format);
//             } else if (/^\d+$/.test(newValue)) {
//               newValue = formatRawDigits(newValue) || '';
//             }
//             setValue(newValue);
//           };

// let newValue = e.target.value;
// if (control.format === 12 || control.format === 24) {
//   newValue = coerceTimeFormat(newValue, control.format);
// } else if (/^\d+$/.test(newValue)) {
//   newValue = formatRawDigits(newValue) || '';
// }
// field.onChange(newValue);

export const TimeFormControl = ({ control }: { control: TimeControl }) => {
  return (
    <InterviewControl control={control}>
      {
        ({ field }) => {
          return (
            <>
              <FormLabel>
                {control.label}
                <Explanation control={control} />
              </FormLabel>
              <FormControl>
                <Time
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  disabled={field.disabled}
                  min={control.min}
                  max={control.max}
                  step={control.minutes_increment ? control.minutes_increment * 60 : undefined}
                />
              </FormControl>
              <FormMessage />
            </>
          );
        }
      }
    </InterviewControl>
  )
};

