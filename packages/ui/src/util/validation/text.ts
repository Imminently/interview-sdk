import type { TextControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { parseNumericOption } from "../numerical";
import { requiredErrStr } from "../global";

export const textValidator = (c: TextControl): z.ZodTypeAny => {
  const { required, variation } = c;
  const max = parseNumericOption(c.max);

  let schema: z.ZodTypeAny = z.string().nullable().optional();

  if (required !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null && v !== "",
      requiredErrStr,
    );
  }

  if (variation?.type === "number") {
    schema = schema.refine(
      (v: unknown) => {
        if (typeof v !== "string") return required === undefined;
        if (v === "" && required === undefined) return true;
        return Boolean((v as string).match(/^-?\d+(\.\d*)?$/));
      },
      "Please input valid number",
    );
  } else if (variation?.type === "email") {
    schema = schema.refine(
      (v: unknown) => {
        if (v === undefined || v === null || v === "") return true;
        return z.string().email().safeParse(v).success;
      },
      "Please provide valid email",
    );
  } else if (max !== undefined) {
    schema = schema.refine(
      (v: unknown) => v === undefined || v === null || (v as string).length <= max,
      `This must be at most ${max} characters`,
    );
  }

  return schema;
};
