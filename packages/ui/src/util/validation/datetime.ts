import {
  DATE_FORMAT,
  type DateTimeControl,
  formatDate,
  TIME_FORMAT_12,
  TIME_FORMAT_24,
} from "@imminently/interview-sdk";
import { z } from "zod";
import { deriveDateFromTimeComponent, requiredErrStr, resolveNowInDate } from "..";

export const datetimeValidator = (c: DateTimeControl): z.ZodTypeAny => {
  const { required, time_max, time_min, date_max, date_min, amPmFormat } = c;

  const nowLessDateMax = resolveNowInDate(date_max);
  const nowLessDateMin = resolveNowInDate(date_min);

  const maxTimeForUi =
    time_max &&
    formatDate(deriveDateFromTimeComponent(time_max), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);
  const minTimeForUi =
    time_min &&
    formatDate(deriveDateFromTimeComponent(time_min), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);

  return z.custom<unknown>().superRefine((v, ctx) => {
    if (v === undefined || v === null || v === "") {
      if (required !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: requiredErrStr });
      }
      return;
    }

    const dateStr = formatDate(new Date(v as string), DATE_FORMAT);
    const timeStr = formatDate(new Date(v as string), TIME_FORMAT_24);

    if (nowLessDateMax !== undefined && dateStr > nowLessDateMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date should be before or equal to ${nowLessDateMax}`,
      });
    }

    if (nowLessDateMin !== undefined && dateStr < nowLessDateMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Date should be after or equal to ${nowLessDateMin}`,
      });
    }

    if (time_max !== undefined && timeStr > time_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Time should be before or equal to ${maxTimeForUi}`,
      });
    }

    if (time_min !== undefined && timeStr < time_min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Time should be after or equal to ${minTimeForUi}`,
      });
    }
  });
};
