import type { RenderableEntityControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { parseNumericOption } from "..";

export const entityValidator = (c: RenderableEntityControl): z.ZodTypeAny | undefined => {
  const min = parseNumericOption((c as any).min);
  const max = parseNumericOption((c as any).max);

  if (min === undefined && max === undefined) return undefined;

  return z.custom<unknown>().superRefine((v, ctx) => {
    const len = Array.isArray(v) ? v.length : 0;

    if (min !== undefined && len < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must have at least ${min} ${min === 1 ? "item" : "items"}`,
      });
    }

    if (max !== undefined && len > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Must have at most ${max} ${max === 1 ? "item" : "items"}`,
      });
    }
  });
};
