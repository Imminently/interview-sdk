import type { CurrencyControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { parseNumericOption } from "../numerical";
import { requiredErrStr } from "../global";

export const currencyValidator = (c: CurrencyControl): z.ZodTypeAny => {
  const { required } = c;
  const max = parseNumericOption(c.max);
  const min = parseNumericOption(c.min);

  let schema: z.ZodTypeAny = z
    .number({ error: "Please specify a valid number. E.g. 5.50" })
    .nullable()
    .optional();

  if (required !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null,
      requiredErrStr,
    );
  }

  if (max !== undefined) {
    schema = schema.refine(
      (v: unknown) => v === undefined || v === null || (v as number) <= max,
      `Should be lower or equal to ${max}`,
    );
  }

  if (min !== undefined) {
    schema = schema.refine(
      (v: unknown) => v === undefined || v === null || (v as number) >= min,
      `Should be bigger or equal to ${min}`,
    );
  }

  return schema;
};
