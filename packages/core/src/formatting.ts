import { isMatch, parse } from "date-fns";
import type { AttributeValue } from "./types";
import { formatDate } from "./util";

export type Formatter = "currency" | `date ${string}` | "date" | `decimalHours ${number}` | "decimalHours" | "uppercase" | "relative";

const PARSE_FORMATS = [
  "uuuu-MM-dd'T'HH:mm:ss",
  "uuuu-MM-dd HH:mm:ss",
  "uuuu-MM-dd'T'HH:mm",
  "uuuu-MM-dd HH:mm",
  "uuuu-MM-dd",
  "-yyyyyy-MM-dd",
  "yyyyyy-MM-dd",
  "-yyyyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  "-yyyyyy-MM-dd'T'HH:mm:ss.SSS",
  "+yyyyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  "+yyyyyy-MM-dd'T'HH:mm:ss.SSS",
  "P",
  "P p",
  "P pS",
  "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  "yyyy-MM-dd'T'HH:mm:ss.SSS",
];

export const getDate = (value: string) => {
  if (value?.length === 4) {
    if (!Number.isNaN(Number.parseInt(value))) {
      return new Date(Number.parseInt(value), 0, 1);
    }
  }

  for (const format of PARSE_FORMATS) {
    if (isMatch(value, format)) {
      return parse(value, format, new Date());
    }
  }
  return undefined;
};

export interface FormatOptions {
  formatters?: string[];
  type?: string;
  locale?: string;
}

const formatDateTimeDefault = (value: string, type: string | undefined, locale: string) => {
  if (type === "number") return value;
  // If no formatters then we just need to clean up any dates
  const date = getDate(value);
  if (date) {
    // It's a date. Render this nicely
    /*const localLocale = moment(d).locale(pass.release?.locale || "en-au");
    if (node && node.type === "date") result = localLocale.format("l");
    else result = localLocale.format("l LT");*/

    let isDate = type === "date";
    // check if it's a date
    if (!isDate) {
      isDate =
        date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
    }

    const formatOptions: Intl.DateTimeFormatOptions = isDate
      ? {}
      : {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "numeric",
          year: "numeric",
        };
    return new Intl.DateTimeFormat([locale, "en-AU"], formatOptions).format(date).toUpperCase().replace(/,/g, "");
  }
  return value;
};

export const formatValue = (value: AttributeValue, options?: FormatOptions) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  let result = typeof value === "string" ? value : value?.toString();
  const { formatters, type, locale } = options || {};

  const resolvedLocale = locale || "en-au";

  if (formatters?.length) {
    for (const f of formatters) {
      const args = f.split(" ");
      switch (args[0]) {
        case "currency":
          if (!Number.isNaN(Number.parseFloat(result))) {
            result = `$${Number.parseFloat(result).toFixed(2)}`;
          }
          break;
        case "date":
          if (args[1]) {
            try {
              const fmt = args.slice(1);
              result = formatDate(result, fmt.join(" "));
            } catch (error) {
              // Ignore all errors- we will just use the current string
            }
          } else {
            result = formatDateTimeDefault(result, type, resolvedLocale);
          }
          break;
        case "decimalHours":
          try {
            const hours = Number.parseFloat(result);
            if (Number.isNaN(hours)) {
              result = "-";
            } else {
              // Check if decimal places are specified (e.g., "decimalHours 2")
              const decimalPlaces = args[1] ? Number.parseInt(args[1], 10) : 3;

              if (Number.isNaN(decimalPlaces) || decimalPlaces < 0) {
                // Invalid decimal places, use default behavior
                const [integerPart, decimalPart] = hours.toString().split(".");
                if (decimalPart && decimalPart.length > 3) {
                  result = `${Number(hours).toFixed(3)} hrs`;
                } else {
                  result = `${hours} hrs`;
                }
              } else {
                // Use specified decimal places
                result = `${Number(hours).toFixed(decimalPlaces)} hrs`;
              }
            }
          } catch (error) {
            result = "-";
          }
          break;
        case "uppercase":
          result = String(result ?? "").toUpperCase();
          break;
        case "relative":
          try {
            // Simple relative date formatting - could be enhanced with date-fns
            const date = new Date(result);
            if (!Number.isNaN(date.getTime())) {
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

              if (diffDays === 0) {
                result = "today";
              } else if (diffDays === 1) {
                result = "yesterday";
              } else if (diffDays === -1) {
                result = "tomorrow";
              } else if (diffDays > 0) {
                result = `${diffDays} days ago`;
              } else {
                result = `in ${Math.abs(diffDays)} days`;
              }
            }
          } catch (error) {
            // Keep original value if parsing fails
          }
          break;
        default:
        // Do nothing
      }
    }
  } else {
    result = formatDateTimeDefault(result, type, resolvedLocale);
  }
  return result;
};
