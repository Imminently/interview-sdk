export type NumericalOptions = {
  /** The minimum numeric value allowed */
  min?: number | string;
  /** The maximum numeric value allowed */
  max?: number | string;
  /** Whether decimal values are allowed (false means integers only) */
  allowDecimals?: boolean;
  /** If decimals are allowed, restrict to this many decimal places */
  maxDecimalPlaces?: number | string;
};

/**
 * Safely parses a numeric option value that may come from the backend as a string.
 * Returns `undefined` for empty strings, non-numeric strings, or non-finite numbers.
 */
export const parseNumericOption = (value: number | string | undefined): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/**
 * Safely parses an arbitrary field value to a number.
 * Returns `undefined` for arrays, objects, booleans, empty strings, or non-finite results.
 */
export const safeParseNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  debugger
  return undefined;
};

/**
 * Derives the appropriate `step` value for a number input from numerical options.
 */
export const getNumericalStep = (options: NumericalOptions | undefined): number => {
  const no = options || {};
  if (no.allowDecimals === false) return 1;

  const minVal = parseNumericOption(no.min);
  const maxVal = parseNumericOption(no.max);
  const maxDecimalPlacesVal = parseNumericOption(no.maxDecimalPlaces);

  if (minVal !== undefined && maxVal !== undefined) {
    const range = maxVal - minVal;
    if (range < 1) {
      if (maxDecimalPlacesVal !== undefined) {
        return 10 ** -Math.max(0, maxDecimalPlacesVal);
      }
      return 0.1;
    }
  }

  return 1;
};
