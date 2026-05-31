import type { OptionsControl } from "@imminently/interview-sdk";
import { z } from "zod";
import { requiredErrStr } from "..";

export const optionsValidator = (c: OptionsControl, manager?: any): z.ZodTypeAny => {
  const { required, asyncOptions } = c;

  let schema: z.ZodTypeAny = z
    .union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()])
    .refine(
      (v) =>
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null ||
        v === undefined,
      "This value should be string, number or boolean",
    );

  if (required !== undefined) {
    schema = schema.refine(
      (v: unknown) => v !== undefined && v !== null && v !== "",
      requiredErrStr,
    );
  }

  // Add async validation for asyncOptions to verify the value exists on the backend
  if (asyncOptions && manager) {
    schema = schema.superRefine(async (v: unknown, ctx) => {
      // Skip validation if value is empty and not required
      if (v === undefined || v === null || v === "") {
        return;
      }

      try {
        const { query, ...options } = asyncOptions;
        const templated = manager.templateText(query, { search: v });
        const res = await manager.getConnectedData({
          ...options,
          query: templated,
        });

        const match = (res.data as any[]).find(
          (item) => item.value === v || item.key === v || item.id === v,
        );

        if (!match) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "The selected value does not exist",
          });
        }
      } catch (error) {
        console.error("Error validating combobox value:", error);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "The selected value does not exist",
        });
      }
    });
  }

  return schema;
};
