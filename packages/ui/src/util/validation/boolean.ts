import type { BooleanControl } from "@imminently/interview-sdk";
import { z } from "zod";

export const booleanValidator = (c: BooleanControl): z.ZodTypeAny => {
  const { required } = c;

  const base = z.boolean().nullable().optional();

  if (required === undefined) return base;

  return base.refine(
    (v) => v !== undefined,
    "This must be checked or unchecked",
  );
};
