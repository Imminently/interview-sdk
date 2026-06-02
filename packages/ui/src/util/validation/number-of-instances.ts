import type { NumberOfInstancesControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { parseNumericOption } from "../numerical";
import { requiredErrStr } from "../global";

export const numberOfInstancesValidator = (c: NumberOfInstancesControl): z.ZodTypeAny => {
  const max = parseNumericOption(c.max);
  const min = parseNumericOption(c.min);

  let schema: z.ZodTypeAny = z
    .number({ error: "Please specify a valid positive integer. E.g. 5" })
    .nullable()
    .optional();

  // number_of_instances is always required
  schema = schema.refine(
    (v: unknown) => v !== undefined && v !== null,
    requiredErrStr,
  );

  if (max !== undefined) {
    schema = schema.refine(
      (v: unknown) => v === undefined || v === null || (v as number) <= max,
      `must be less than or equal to ${max}`,
    );
  }

  schema = schema.refine(
    (v: unknown) => v === undefined || v === null || (v as number) >= (min ?? 0),
    `must be greater than or equal to ${min ?? 0}`,
  );

  return schema;
};
