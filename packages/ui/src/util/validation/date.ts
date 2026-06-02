import type { DateControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { requiredErrStr, resolveNowInDate } from "../global";

/** a.k.a YYYY-MM-DD */
const DATE_FORMAT_REGEX = /^\d\d\d\d-\d\d-\d\d$/;

export const dateValidator = (c: DateControl): z.ZodTypeAny => {
  const { max, min, required } = c;

  const nowLessMax = resolveNowInDate(max);
  const nowLessMin = resolveNowInDate(min);

  let schema: z.ZodTypeAny = z.string().nullable().optional();

  if (required !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null && v !== "",
      requiredErrStr,
    );
  }

  schema = schema
    .transform((v: unknown) => resolveNowInDate(v as string | undefined))
    .refine(
      (v: unknown) =>
        v === undefined || v === null || v === ""
          ? true
          : Boolean(
              (v as string).match(DATE_FORMAT_REGEX) &&
                !Number.isNaN(Number(new Date(v as string))),
            ),
      "Should be formatted like YYYY-MM-DD",
    );

  if (nowLessMax !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null && (v as string) <= nowLessMax,
      `Should be before or equal to ${nowLessMax}`,
    );
  }

  if (nowLessMin !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null && (v as string) >= nowLessMin,
      `Should be after or equal to ${nowLessMin}`,
    );
  }

  return schema;
};
