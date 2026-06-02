import { describe, expect, test } from "bun:test";
import { currencyValidator } from "../../src/util/validation/currency";

const base = { id: "ctrl-1", type: "currency" as const, attribute: "attr-1" };

describe("currencyValidator", () => {
  describe("without constraints", () => {
    const schema = currencyValidator(base);

    test("accepts a number", () => {
      expect(schema.safeParse(42.5).success).toBe(true);
    });

    test("accepts negative number", () => {
      expect(schema.safeParse(-10).success).toBe(true);
    });

    test("accepts zero", () => {
      expect(schema.safeParse(0).success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("rejects string", () => {
      const result = schema.safeParse("42.5");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please specify a valid number. E.g. 5.50");
      }
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });

    test("rejects array", () => {
      expect(schema.safeParse([1, 2]).success).toBe(false);
    });

    test("rejects object", () => {
      expect(schema.safeParse({ amount: 10 }).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = currencyValidator({ ...base, required: true });

    test("accepts a number", () => {
      expect(schema.safeParse(99.99).success).toBe(true);
    });

    test("rejects null", () => {
      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please fill out this field");
      }
    });

    test("rejects undefined", () => {
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please fill out this field");
      }
    });
  });

  describe("with max", () => {
    const schema = currencyValidator({ ...base, max: 100 });

    test("accepts value equal to max", () => {
      expect(schema.safeParse(100).success).toBe(true);
    });

    test("accepts value below max", () => {
      expect(schema.safeParse(50).success).toBe(true);
    });

    test("rejects value above max", () => {
      const result = schema.safeParse(101);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be lower or equal to 100");
      }
    });

    test("accepts null (no value to range-check)", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });
  });

  describe("with min", () => {
    const schema = currencyValidator({ ...base, min: 10 });

    test("accepts value equal to min", () => {
      expect(schema.safeParse(10).success).toBe(true);
    });

    test("accepts value above min", () => {
      expect(schema.safeParse(50).success).toBe(true);
    });

    test("rejects value below min", () => {
      const result = schema.safeParse(5);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be bigger or equal to 10");
      }
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });
  });

  describe("with both min and max", () => {
    const schema = currencyValidator({ ...base, min: 0, max: 500 });

    test("accepts value within range", () => {
      expect(schema.safeParse(250).success).toBe(true);
    });

    test("rejects value above max", () => {
      expect(schema.safeParse(501).success).toBe(false);
    });

    test("rejects value below min", () => {
      expect(schema.safeParse(-1).success).toBe(false);
    });
  });

  describe("with numeric string min/max (from backend)", () => {
    const schema = currencyValidator({ ...base, min: "5" as any, max: "50" as any });

    test("accepts value in range", () => {
      expect(schema.safeParse(25).success).toBe(true);
    });

    test("rejects value above string max", () => {
      expect(schema.safeParse(51).success).toBe(false);
    });
  });
});
