import type { NumberControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { parseNumericOption } from "../numerical";
import { requiredErrStr } from "../global";

export const numberValidator = (c: NumberControl): z.ZodTypeAny => {
  const { required, numericalOptions } = c;
  const min = parseNumericOption(numericalOptions?.min);
  const max = parseNumericOption(numericalOptions?.max);
  const allowDecimals = numericalOptions?.allowDecimals;
  const maxDecimalPlaces = parseNumericOption(numericalOptions?.maxDecimalPlaces);

  let schema: z.ZodTypeAny = z
    .number({ error: "Please specify a valid number. E.g. 5" })
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

  if (allowDecimals === false) {
    schema = schema.refine(
      (v: unknown) => v === undefined || v === null || Number.isInteger(v as number),
      "Please specify a whole number. E.g. 5",
    );
  } else if (maxDecimalPlaces !== undefined) {
    schema = schema.refine(
      (v: unknown) => {
        if (v === undefined || v === null) return true;
        const decimalStr = String(v as number).split(".")[1];
        return decimalStr === undefined || decimalStr.length <= maxDecimalPlaces;
      },
      `Please specify a number with at most ${maxDecimalPlaces} decimal places`,
    );
  }

  return schema;
};
