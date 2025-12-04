import { useInterview } from "@/interview/InterviewContext";
import {
  DATE_FORMAT,
  formatDate,
  type RenderableControl,
  TIME_FORMAT_12,
  TIME_FORMAT_24,
  Validation,
  // isFileAttributeValue,
} from "@imminently/interview-sdk";
import {
  type Field,
  type FieldError,
  type FieldErrors,
  type FieldValues,
  get,
  type InternalFieldName,
  type Ref,
  type ResolverOptions,
  set,
} from "react-hook-form";
import * as yup from "yup";
import { deriveDateFromTimeComponent, requiredErrStr, resolveNowInDate } from "./index";
import { useMemo } from "react";
import { useTheme } from "@/providers/ThemeProvider";

// Helper: parse various time representations into seconds since midnight.
const timeToSeconds = (input: any): number => {
  if (input === undefined || input === null || input === "") return NaN;

  // If it's already a Date, extract local time parts
  if (input instanceof Date && !Number.isNaN(Number(input))) {
    // ignore seconds, as we don't support that precision in the UI
    return input.getHours() * 3600 + input.getMinutes() * 60;
  }

  const s = String(input).trim();

  // Match HH:MM(:SS)? with optional AM/PM
  const match = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (match) {
    let hh = Number(match[1]);
    const mm = Number(match[2]);
    // const ss = Number(match[3] ?? 0);
    const ampm = match[4];
    if (ampm) {
      const up = ampm.toUpperCase();
      if (up === "AM") {
        if (hh === 12) hh = 0;
      } else if (up === "PM") {
        if (hh !== 12) hh += 12;
      }
    }
    // ignore seconds, as we don't support that precision in the UI
    return hh * 3600 + mm * 60;
  }

  // Fallback: attempt Date parse (may include timezone offsets)
  const dt = new Date(s);
  if (!Number.isNaN(Number(dt))) {
    // ignore seconds, as we don't support that precision in the UI
    return dt.getHours() * 3600 + dt.getMinutes() * 60;
  }

  return NaN;
};

const setCustomValidity = (ref: Ref, fieldPath: string, errors: FieldErrors) => {
  if (ref && "reportValidity" in ref) {
    const error = get(errors, fieldPath) as FieldError | undefined;
    ref.setCustomValidity(error?.message || "");

    ref.reportValidity();
  }
};

// Native validation (web only)
export const validateFieldsNatively = <TFieldValues extends FieldValues>(
  errors: FieldErrors,
  options: ResolverOptions<TFieldValues>,
): void => {
  for (const fieldPath in options.fields) {
    const field = options.fields[fieldPath];
    if (field?.ref && "reportValidity" in field.ref) {
      setCustomValidity(field.ref, fieldPath, errors);
    } else if (field.refs) {
      for (const ref of field.refs) {
        setCustomValidity(ref, fieldPath, errors);
      }
    }
  }
};

export const toNestErrors = <TFieldValues extends FieldValues>(
  errors: FieldErrors,
  options: ResolverOptions<TFieldValues>,
): FieldErrors<TFieldValues> => {
  options.shouldUseNativeValidation && validateFieldsNatively(errors, options);

  const fieldErrors = {} as FieldErrors<TFieldValues>;
  for (const path in errors) {
    const field = get(options.fields, path) as Field["_f"] | undefined;
    const error = Object.assign(errors[path] || {}, {
      ref: field?.ref,
    });

    if (isNameInFieldArray(options.names || Object.keys(errors), path)) {
      const fieldArrayErrors = Object.assign({}, get(fieldErrors, path));

      set(fieldArrayErrors, "root", error);
      set(fieldErrors, path, fieldArrayErrors);
    } else {
      set(fieldErrors, path, error);
    }
  }

  return fieldErrors;
};

const isNameInFieldArray = (names: InternalFieldName[], name: InternalFieldName) =>
  names.some((n) => n.startsWith(`${name}.`));

/**
 * Generates a yup validator schema for a control.
 * This is a pure function that can be called with or without a manager.
 * @param c The control to generate a validator for
 * @param manager Optional manager instance for async validation (e.g., for async options)
 * @returns A yup schema or undefined if no validation is needed
 */
export const generateValidatorForControl = (c: RenderableControl, manager?: any): yup.AnySchema | undefined => {
  switch (c.type) {
    case "boolean": {
      const { required } = c;

      const schema = yup.boolean().nullable();
      const maybeDefined: typeof schema =
        required === undefined ? schema : schema.defined("This must be checked or unchecked");
      // schema.test(
      //   'withDefined',
      //   '',
      //   v => typeof v === 'boolean',
      // )

      return maybeDefined;
    }
    case "currency": {
      const { max, min, required } = c;

      const schema = yup.number().typeError("Please specify a valid number. E.g. 5.50").nullable();
      const withRequired: typeof schema =
        required === undefined
          ? schema
          : schema.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null);

      const afterMax: typeof withRequired =
        max === undefined
          ? withRequired
          : withRequired.test(
            "withMax",
            `Should be lower or equal to ${max}`,
            (v) => v !== undefined && v !== null && v <= max,
          );

      const afterMin: typeof afterMax =
        min === undefined
          ? afterMax
          : afterMax.test(
            "withMin",
            `Should be bigger or equal to ${min}`,
            (v) => v !== undefined && v !== null && v >= min,
          );

      return afterMin;
    }
    case "date": {
      const { max, min, required } = c;
      /** a.k.a YYYY-MM-DD */
      const DATE_FORMAT_REGEX = /^\d\d\d\d-\d\d-\d\d$/;

      const nowLessMax = resolveNowInDate(max);
      const nowLessMin = resolveNowInDate(min);

      const schema = yup.string().nullable();
      const finalSchema: typeof schema = [schema]
        .map((it) =>
          required === undefined
            ? it
            : it.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null && v !== ""),
        )
        .map((it) =>
          it.transform((v) => {
            return resolveNowInDate(v);
          }).test("correctFormat", "Should be formatted like YYYY-MM-DD", (v) =>
            v === undefined || v === null || v === ""
              ? true
              : Boolean(v.match(DATE_FORMAT_REGEX) && Number.isNaN(Number(new Date(v))) === false),
          ),
        )
        .map((it) =>
          nowLessMax === undefined
            ? it
            : it.test(
              "withMax",
              `Should be before or equal to ${nowLessMax}`,
              (v) => v !== undefined && v !== null && v <= nowLessMax,
            ),
        )
        .map((it) =>
          nowLessMin === undefined
            ? it
            : it.test(
              "withMin",
              `Should be after or equal to ${nowLessMin}`,
              (v) => v !== undefined && v !== null && v >= nowLessMin,
            ),
        )[0];

      return finalSchema;
    }
    case "time": {
      const { max, min, required, amPmFormat } = c;

      // for easy comparison, we will convert time to seconds since midnight
      const minSeconds = min === undefined ? undefined : timeToSeconds(min);
      const maxSeconds = max === undefined ? undefined : timeToSeconds(max);
      // format min/max for UI display
      const maxForUi =
        max && formatDate(new Date(max), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);
      const minForUi =
        min && formatDate(new Date(min), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);

      // Use a numeric schema (seconds since midnight) so we can use yup.min / yup.max
      const schema = yup
        .number()
        .nullable()
        .transform(function (value, originalValue) {
          if (originalValue === undefined || originalValue === null || originalValue === "") return undefined;
          const secs = timeToSeconds(originalValue);
          return Number.isFinite(secs) ? secs : NaN;
        })
        .typeError("Please specify a valid time");

      const withRequired: typeof schema =
        required === undefined
          ? schema
          : schema.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null);

      const withMax: typeof withRequired =
        maxSeconds === undefined
          ? withRequired
          : withRequired.max(maxSeconds!, `Should be before or equal to ${maxForUi}`);

      const withMin: typeof withMax =
        minSeconds === undefined
          ? withMax
          : withMax.min(minSeconds!, `Should be after or equal to ${minForUi}`);

      return withMin;
    }
    case "datetime": {
      const { required, time_max, time_min, date_max, date_min, amPmFormat } = c;

      const nowLessDateMax = resolveNowInDate(date_max);
      const nowLessDateMin = resolveNowInDate(date_min);

      const maxTimeForUi =
        time_max && formatDate(deriveDateFromTimeComponent(time_max), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);
      const minTimeForUi =
        time_min && formatDate(deriveDateFromTimeComponent(time_min), amPmFormat ? TIME_FORMAT_12 : TIME_FORMAT_24);

      const schema = yup.string().nullable();

      const withRequired: typeof schema =
        required === undefined
          ? schema
          : schema.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null);

      const withDateMax: typeof withRequired =
        nowLessDateMax === undefined
          ? withRequired
          : withRequired.test(
            "withDateMax",
            `Date should be before or equal to ${nowLessDateMax}`,
            (v) => v !== undefined && v !== null && formatDate(new Date(v), DATE_FORMAT) <= nowLessDateMax,
          );

      const withDateMin: typeof withDateMax =
        nowLessDateMin === undefined
          ? withDateMax
          : withDateMax.test(
            "withDateMin",
            `Date should be after or equal to ${nowLessDateMin}`,
            (v) => v !== undefined && v !== null && formatDate(new Date(v), DATE_FORMAT) >= nowLessDateMin,
          );

      const withTimeMax: typeof withDateMin =
        time_max === undefined
          ? withDateMin
          : withDateMin.test(
            "withTimeMax",
            `Time should be before or equal to ${maxTimeForUi}`,
            (v) => v !== undefined && v !== null && formatDate(new Date(v), TIME_FORMAT_24) <= time_max,
          );

      const withTimeMin: typeof withTimeMax =
        time_min === undefined
          ? withTimeMax
          : withTimeMax.test(
            "withTimeMin",
            `Time should be after or equal to ${minTimeForUi}`,
            (v) => v !== undefined && v !== null && formatDate(new Date(v), TIME_FORMAT_24) >= time_min,
          );

      return withTimeMin;
    }
    case "number_of_instances": {
      const { max, min } = c;

      const schema = yup.number().typeError("Please specify a valid positive integer. E.g. 5").nullable();

      const withRequired: typeof schema = schema.test(
        "withRequired",
        requiredErrStr,
        (v) => v !== undefined && v !== null,
      );

      const withMax: typeof withRequired =
        max === undefined ? withRequired : withRequired.max(max, `must be less than or equal to ${max}`);

      const withMin: typeof withMax = withMax.min(min ?? 0, `must be greater than or equal to ${min}`);

      return withMin;
    }
    case "text": {
      const { required, max, variation } = c;

      const schema = yup.string().nullable();
      const maybeRequired: typeof schema =
        required === undefined
          ? schema
          : schema.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null && v !== "");

      const nextSchema = ((): typeof maybeRequired => {
        if (variation !== undefined && variation.type === "number") {
          return maybeRequired.test("asNumber", "Please input valid number", (v) => {
            if (typeof v !== "string") return required === undefined;
            if (v === "" && required === undefined) return true;

            return Boolean(v.match(/^-?\d+(\.\d*)?$/));
          });
        }

        const maybeWithEmail =
          variation !== undefined && variation.type === "email"
            ? maybeRequired.email("Please provide valid email")
            : maybeRequired;

        return max === undefined ? maybeWithEmail : maybeWithEmail.max(max, `This must be at most ${max} characters`);
      })();

      return nextSchema;
    }
    case "options": {
      const { required, asyncOptions } = c;

      const schema = yup.mixed().nullable();

      const maybeRequired: typeof schema =
        required === undefined
          ? schema
          : schema.test("withRequired", requiredErrStr, (v) => v !== undefined && v !== null && v !== "");

      const withType: typeof maybeRequired = maybeRequired.test(
        "isStringOrNumberOrBoolOrNullOrUndefined",
        "This value should be string, number or boolean",
        (v) =>
          typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null || v === undefined,
      );

      // Add async validation for asyncOptions to verify the value exists on the backend
      const withAsyncValidation: typeof withType =
        asyncOptions && manager
          ? withType.test({
            name: "asyncOptionExists",
            message: "The selected value does not exist",
            test: async (value) => {
              // Skip validation if value is empty and not required
              if (value === undefined || value === null || value === "") {
                return required === undefined ? true : false;
              }

              try {
                const { query, ...options } = asyncOptions;
                const templated = manager.templateText(query, { search: value });
                const res = await manager.getConnectedData({
                  ...options,
                  query: templated
                });

                // Find the item that matches the value
                const match = (res.data as any[]).find(
                  item => item.value === value || item.key === value || item.id === value
                );

                return Boolean(match);
              } catch (error) {
                console.error("Error validating combobox value:", error);
                return false;
              }
            },
          })
          : withType;

      return withAsyncValidation;
    }
    case "file": {
      const { required } = c;

      if (required !== true) return undefined;

      const requiredSchema = yup
        .mixed()
        .nullable()
        .test("isNotEmpty", "Required", (v) => {
          if (v === null || v === undefined) return false;

          if (Boolean(v) === false) {
            // no idea how this would happen, but need to report at least soemthing
            console.error("0RsLCXOHdW | Interview-react-material: not a file attrib value");
            return false;
          }

          // @ts-ignore
          return v.fileRefs.length > 0;
        });

      return requiredSchema;
    }

    default:
      return undefined;
  }
};

/**
 * Hook to generate a memoized yup validator for a control.
 * This hook accesses the interview manager for async validation support.
 * The result is memoized based on the control, as manager methods are stable.
 * 
 * @param control The control to generate a validator for
 * @returns A memoized yup schema or undefined if no validation is needed
 */
export const useValidatorForControl = (control: RenderableControl): yup.AnySchema | undefined => {
  const { manager } = useInterview();

  return useMemo(
    () => generateValidatorForControl(control, manager),
    [control]
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
export const useAttributeValidationErrors = (attribute: string | undefined, severity: string | undefined = "error") => {
  const { session } = useInterview();
  const { t } = useTheme();

  // split regex based on / or .
  const baseAttribute = attribute?.split(/[\/\.]/).pop() as string;

  const validations = useMemo(() => {
    return (session.validations ?? [])
      // only want those that apply to this attribute and are shown
      .filter((v) => v.shown && (baseAttribute ? v.attributes.findIndex((a: string) => a.includes(baseAttribute)) > -1 : true))
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
  }, [session.validations, baseAttribute]);

  return validations;
};
