import { isMatch, parse } from "date-fns";
import type { AttributeValue } from "./types";
import { formatDate } from "./util";

export type Formatter = "currency" | `date ${string}` | "date";

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
        default:
        // Do nothing
      }
    }
  } else {
    result = formatDateTimeDefault(result, type, resolvedLocale);
  }
  return result;
};
