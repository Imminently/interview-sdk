import { useInterview } from "@/interview/InterviewContext";
import { useTheme } from "@/providers/ThemeProvider";
import { type RenderableControl, type Validation } from "@imminently/interview-sdk";
import { useMemo } from "react";
import type { z } from "zod";
import { booleanValidator } from "./boolean";
import { currencyValidator } from "./currency";
import { dateValidator } from "./date";
import { datetimeValidator } from "./datetime";
import { entityValidator } from "./entity";
import { fileValidator } from "./file";
import { numberOfInstancesValidator } from "./number-of-instances";
import { numberValidator } from "./number";
import { optionsValidator } from "./options";
import { textValidator } from "./text";
import { timeValidator } from "./time";

export * from "./helpers";

/**
 * Generates a zod validator schema for a control.
 * This is a pure function that can be called with or without a manager.
 * @param c The control to generate a validator for
 * @param manager Optional manager instance for async validation (e.g., for async options)
 * @returns A zod schema or undefined if no validation is needed
 */
export const generateValidatorForControl = (
  c: RenderableControl,
  manager?: any,
): z.ZodTypeAny | undefined => {
  switch (c.type) {
    case "boolean":
      return booleanValidator(c);
    case "currency":
      return currencyValidator(c);
    case "number":
      return numberValidator(c);
    case "date":
      return dateValidator(c);
    case "time":
      return timeValidator(c);
    case "datetime":
      return datetimeValidator(c);
    case "number_of_instances":
      return numberOfInstancesValidator(c);
    case "text":
      return textValidator(c);
    case "options":
      return optionsValidator(c, manager);
    case "file":
      return fileValidator(c);
    case "entity":
      return entityValidator(c);
    default:
      return undefined;
  }
};

/**
 * Hook to generate a memoized zod validator for a control.
 * This hook accesses the interview manager for async validation support.
 * The result is memoized based on the control, as manager methods are stable.
 *
 * @param control The control to generate a validator for
 * @returns A memoized zod schema or undefined if no validation is needed
 */
export const useValidatorForControl = (control: RenderableControl): z.ZodTypeAny | undefined => {
  const { manager } = useInterview();

  return useMemo(
    () => generateValidatorForControl(control, manager),
    [control],
  );
};

/**
 * A utility hook to retrieve validation errors for a specific attribute.
 * This hook filters the session's validations to find those that are shown
 * and include the specified attribute, returning them sorted by the number of attributes.
 *
 * @param attribute The attribute to check for validation errors. If none, returns all valid interview errors.
 * @returns An array of validation errors for the given attribute. Validations are translated.
 */
export const useAttributeValidationErrors = (
  attribute: string | undefined,
  severity: string | undefined = "error",
) => {
  const { session } = useInterview();
  const { t } = useTheme();

  // split regex based on / or .
  const baseAttribute = attribute?.split(/[\/\.]/).pop() as string;
  // session may not exist, so default to empty array
  const validationData = session?.validations ?? [];

  const validations = useMemo(() => {
    return validationData
      // only want those that apply to this attribute and are shown
      .filter((v) =>
        v.shown &&
        (baseAttribute
          ? v.attributes.findIndex((a: string) => a.includes(baseAttribute)) > -1
          : true),
      )
      // only want errors
      .filter((v) => v.severity === severity)
      // remove duplicates by message
      .reduce((unique, item) => {
        if (!unique.some((v) => v.message === item.message)) {
          unique.push(item);
        }
        return unique;
      }, [] as Validation[])
      // translate messages
      .map((v) => ({ ...v, message: t(v.message) }))
      // sort by number of attributes (fewer attributes = more specific)
      .sort((a, b) => a.attributes.length - b.attributes.length);
  }, [validationData, baseAttribute]);

  return validations;
};
