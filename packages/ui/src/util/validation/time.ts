import { formatDate, type TimeControl, TIME_FORMAT_12, TIME_FORMAT_24 } from "@imminently/interview-sdk";
import { z } from "zod";
import { deriveDateFromTimeComponent, requiredErrStr } from "../global";
import { timeToSeconds } from "./helpers";

export const timeValidator = (c: TimeControl): z.ZodTypeAny => {
  const { max, min, required, amPmFormat } = c;

  const minSeconds = min === undefined ? undefined : timeToSeconds(min);
  const maxSeconds = max === undefined ? undefined : timeToSeconds(max);
  const maxForUi = max && formatDate(deriveDateFromTimeComponent(max), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);
  const minForUi = min && formatDate(deriveDateFromTimeComponent(min), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);

  return z.custom<unknown>().superRefine((v, ctx) => {
    if (v === undefined || v === null || v === "") {
      if (required !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: requiredErrStr });
      }
      return;
    }

    const secs = timeToSeconds(v);
    if (!Number.isFinite(secs)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please specify a valid time" });
      return;
    }

    if (maxSeconds !== undefined && Number.isFinite(maxSeconds) && secs > maxSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Should be before or equal to ${maxForUi}`,
      });
    }

    if (minSeconds !== undefined && Number.isFinite(minSeconds) && secs < minSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Should be after or equal to ${minForUi}`,
      });
    }
  });
};
