import { describe, expect, test } from "bun:test";
import { getNumericalStep, parseNumericOption, safeParseNumber } from "../../src/util/numerical";

describe("parseNumericOption", () => {
  describe("number inputs", () => {
    test("returns the number as-is for integers", () => {
      expect(parseNumericOption(0)).toBe(0);
      expect(parseNumericOption(5)).toBe(5);
      expect(parseNumericOption(-10)).toBe(-10);
    });

    test("returns the number as-is for decimals", () => {
      expect(parseNumericOption(3.14)).toBe(3.14);
    });

    test("returns undefined for Infinity", () => {
      expect(parseNumericOption(Number.POSITIVE_INFINITY)).toBeUndefined();
    });

    test("returns undefined for -Infinity", () => {
      expect(parseNumericOption(Number.NEGATIVE_INFINITY)).toBeUndefined();
    });

    test("returns undefined for NaN", () => {
      expect(parseNumericOption(Number.NaN)).toBeUndefined();
    });
  });

  describe("string inputs", () => {
    test("parses a numeric string", () => {
      expect(parseNumericOption("5")).toBe(5);
      expect(parseNumericOption("3.14")).toBe(3.14);
      expect(parseNumericOption("-10")).toBe(-10);
    });

    test("parses a numeric string with surrounding whitespace", () => {
      expect(parseNumericOption("  42  ")).toBe(42);
    });

    test("returns undefined for empty string", () => {
      expect(parseNumericOption("")).toBeUndefined();
    });

    test("returns undefined for whitespace-only string", () => {
      expect(parseNumericOption("   ")).toBeUndefined();
    });

    test("returns undefined for non-numeric string", () => {
      expect(parseNumericOption("abc")).toBeUndefined();
      expect(parseNumericOption("5abc")).toBeUndefined();
    });
  });

  describe("undefined input", () => {
    test("returns undefined for undefined", () => {
      expect(parseNumericOption(undefined)).toBeUndefined();
    });
  });
});

describe("safeParseNumber", () => {
  describe("number inputs", () => {
    test("returns finite numbers as-is", () => {
      expect(safeParseNumber(0)).toBe(0);
      expect(safeParseNumber(42)).toBe(42);
      expect(safeParseNumber(-5.5)).toBe(-5.5);
    });

    test("returns undefined for Infinity", () => {
      expect(safeParseNumber(Number.POSITIVE_INFINITY)).toBeUndefined();
    });

    test("returns undefined for NaN", () => {
      expect(safeParseNumber(Number.NaN)).toBeUndefined();
    });
  });

  describe("string inputs", () => {
    test("parses a valid numeric string", () => {
      expect(safeParseNumber("7")).toBe(7);
      expect(safeParseNumber("3.14")).toBe(3.14);
    });

    test("returns undefined for empty string", () => {
      expect(safeParseNumber("")).toBeUndefined();
    });

    test("returns undefined for whitespace-only string", () => {
      expect(safeParseNumber("  ")).toBeUndefined();
    });

    test("returns undefined for non-numeric string", () => {
      expect(safeParseNumber("hello")).toBeUndefined();
    });
  });

  describe("non-numeric types", () => {
    test("returns undefined for boolean", () => {
      expect(safeParseNumber(true)).toBeUndefined();
      expect(safeParseNumber(false)).toBeUndefined();
    });

    test("returns undefined for array", () => {
      expect(safeParseNumber([1, 2])).toBeUndefined();
    });

    test("returns undefined for object", () => {
      expect(safeParseNumber({ value: 5 })).toBeUndefined();
    });

    test("returns undefined for null", () => {
      expect(safeParseNumber(null)).toBeUndefined();
    });

    test("returns undefined for undefined", () => {
      expect(safeParseNumber(undefined)).toBeUndefined();
    });
  });
});

describe("getNumericalStep", () => {
  describe("undefined / empty options", () => {
    test("returns 1 for undefined options", () => {
      expect(getNumericalStep(undefined)).toBe(1);
    });

    test("returns 1 for empty options object", () => {
      expect(getNumericalStep({})).toBe(1);
    });
  });

  describe("allowDecimals: false", () => {
    test("returns 1 regardless of other options", () => {
      expect(getNumericalStep({ allowDecimals: false })).toBe(1);
      expect(getNumericalStep({ allowDecimals: false, min: 0, max: 0.5 })).toBe(1);
      expect(getNumericalStep({ allowDecimals: false, maxDecimalPlaces: 3 })).toBe(1);
    });
  });

  describe("range < 1 (fractional range)", () => {
    test("returns 0.1 by default when range < 1", () => {
      expect(getNumericalStep({ min: 0, max: 0.5 })).toBe(0.1);
    });

    test("uses maxDecimalPlaces to derive step when range < 1", () => {
      expect(getNumericalStep({ min: 0, max: 0.5, maxDecimalPlaces: 2 })).toBe(0.01);
      expect(getNumericalStep({ min: 0, max: 0.9, maxDecimalPlaces: 3 })).toBe(0.001);
    });

    test("maxDecimalPlaces: 0 gives step 1", () => {
      expect(getNumericalStep({ min: 0, max: 0.9, maxDecimalPlaces: 0 })).toBe(1);
    });
  });

  describe("range >= 1", () => {
    test("returns 1 for a range of exactly 1", () => {
      expect(getNumericalStep({ min: 0, max: 1 })).toBe(1);
    });

    test("returns 1 for a large range", () => {
      expect(getNumericalStep({ min: 0, max: 1000 })).toBe(1);
    });

    test("maxDecimalPlaces is ignored when range >= 1", () => {
      expect(getNumericalStep({ min: 0, max: 10, maxDecimalPlaces: 2 })).toBe(1);
    });
  });

  describe("min or max missing (only one provided)", () => {
    test("returns 1 when only min is provided", () => {
      expect(getNumericalStep({ min: 5 })).toBe(1);
    });

    test("returns 1 when only max is provided", () => {
      expect(getNumericalStep({ max: 100 })).toBe(1);
    });
  });

  describe("string min/max (from backend)", () => {
    test("parses string values and uses the range", () => {
      expect(getNumericalStep({ min: "0", max: "0.5" })).toBe(0.1);
      expect(getNumericalStep({ min: "0", max: "100" })).toBe(1);
    });
  });
});
