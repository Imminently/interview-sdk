import { type Field, type FieldError, type FieldErrors, type FieldValues, get, type InternalFieldName, type Ref, type ResolverOptions, set } from "react-hook-form";

// Helper: parse various time representations into seconds since midnight.
export const timeToSeconds = (input: any): number => {
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

export const formatDateForValidationMessage = (value: string | undefined): string | undefined => {
  if (!value) return value;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(Number(date))) return value;

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
