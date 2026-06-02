import { describe, expect, test } from "bun:test";
import { numberValidator } from "../../src/util/validation/number";

const base = { id: "ctrl-1", type: "number" as const, attribute: "attr-1" };

describe("numberValidator", () => {
  describe("without constraints", () => {
    const schema = numberValidator(base);

    test("accepts a positive number", () => {
      expect(schema.safeParse(10).success).toBe(true);
    });

    test("accepts a negative number", () => {
      expect(schema.safeParse(-5).success).toBe(true);
    });

    test("accepts zero", () => {
      expect(schema.safeParse(0).success).toBe(true);
    });

    test("accepts a decimal", () => {
      expect(schema.safeParse(3.14).success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("rejects string", () => {
      const result = schema.safeParse("10");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please specify a valid number. E.g. 5");
      }
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });

    test("rejects object", () => {
      expect(schema.safeParse({ value: 5 }).success).toBe(false);
    });

    test("rejects array", () => {
      expect(schema.safeParse([1]).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = numberValidator({ ...base, required: true });

    test("accepts a number", () => {
      expect(schema.safeParse(7).success).toBe(true);
    });

    test("accepts zero", () => {
      expect(schema.safeParse(0).success).toBe(true);
    });

    test("rejects null", () => {
      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please fill out this field");
      }
    });

    test("rejects undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(false);
    });
  });

  describe("with numericalOptions.max", () => {
    const schema = numberValidator({ ...base, numericalOptions: { max: 100 } });

    test("accepts value at max", () => {
      expect(schema.safeParse(100).success).toBe(true);
    });

    test("accepts value below max", () => {
      expect(schema.safeParse(99).success).toBe(true);
    });

    test("rejects value above max", () => {
      const result = schema.safeParse(101);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be lower or equal to 100");
      }
    });
  });

  describe("with numericalOptions.min", () => {
    const schema = numberValidator({ ...base, numericalOptions: { min: 1 } });

    test("accepts value at min", () => {
      expect(schema.safeParse(1).success).toBe(true);
    });

    test("accepts value above min", () => {
      expect(schema.safeParse(5).success).toBe(true);
    });

    test("rejects value below min", () => {
      const result = schema.safeParse(0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be bigger or equal to 1");
      }
    });
  });

  describe("with allowDecimals: false", () => {
    const schema = numberValidator({ ...base, numericalOptions: { allowDecimals: false } });

    test("accepts integer", () => {
      expect(schema.safeParse(5).success).toBe(true);
    });

    test("rejects decimal", () => {
      const result = schema.safeParse(5.5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please specify a whole number. E.g. 5");
      }
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });
  });

  describe("with maxDecimalPlaces", () => {
    const schema = numberValidator({ ...base, numericalOptions: { maxDecimalPlaces: 2 } });

    test("accepts integer", () => {
      expect(schema.safeParse(5).success).toBe(true);
    });

    test("accepts 1 decimal place", () => {
      expect(schema.safeParse(5.1).success).toBe(true);
    });

    test("accepts exactly 2 decimal places", () => {
      expect(schema.safeParse(5.12).success).toBe(true);
    });

    test("rejects 3 decimal places", () => {
      const result = schema.safeParse(5.123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please specify a number with at most 2 decimal places");
      }
    });
  });
});
