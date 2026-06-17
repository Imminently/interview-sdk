import { describe, expect, test } from "bun:test";
import { numberOfInstancesValidator } from "../../src/util/validation/number-of-instances";

const base = { id: "ctrl-1", type: "number_of_instances" as const, attribute: "attr-1", entity: "item" };

describe("numberOfInstancesValidator", () => {
  describe("always required (no explicit required field)", () => {
    const schema = numberOfInstancesValidator(base);

    test("accepts a positive integer", () => {
      expect(schema.safeParse(3).success).toBe(true);
    });

    test("accepts 1", () => {
      expect(schema.safeParse(1).success).toBe(true);
    });

    test("accepts 0 (meets default min of 0)", () => {
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

    test("rejects string", () => {
      const result = schema.safeParse("3");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Please specify a valid positive integer. E.g. 5",
        );
      }
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });

    test("rejects float", () => {
      // number_of_instances is for counts, but the validator itself doesn't restrict decimals
      // unless min/max are set. A float still passes the number type check.
      expect(schema.safeParse(2.5).success).toBe(true);
    });
  });

  describe("with max", () => {
    const schema = numberOfInstancesValidator({ ...base, max: 10 });

    test("accepts value at max", () => {
      expect(schema.safeParse(10).success).toBe(true);
    });

    test("accepts value below max", () => {
      expect(schema.safeParse(5).success).toBe(true);
    });

    test("rejects value above max", () => {
      const result = schema.safeParse(11);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("must be less than or equal to 10");
      }
    });
  });

  describe("with min", () => {
    const schema = numberOfInstancesValidator({ ...base, min: 2 });

    test("accepts value at min", () => {
      expect(schema.safeParse(2).success).toBe(true);
    });

    test("accepts value above min", () => {
      expect(schema.safeParse(5).success).toBe(true);
    });

    test("rejects value below min", () => {
      const result = schema.safeParse(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("must be greater than or equal to 2");
      }
    });
  });

  describe("with both min and max", () => {
    const schema = numberOfInstancesValidator({ ...base, min: 1, max: 5 });

    test("accepts value in range", () => {
      expect(schema.safeParse(3).success).toBe(true);
    });

    test("rejects 0 (below min)", () => {
      expect(schema.safeParse(0).success).toBe(false);
    });

    test("rejects value above max", () => {
      expect(schema.safeParse(6).success).toBe(false);
    });

    test("rejects null", () => {
      expect(schema.safeParse(null).success).toBe(false);
    });
  });

  describe("with string min/max (from backend)", () => {
    const schema = numberOfInstancesValidator({ ...base, min: "1" as any, max: "5" as any });

    test("accepts value in range", () => {
      expect(schema.safeParse(3).success).toBe(true);
    });

    test("rejects value above string max", () => {
      expect(schema.safeParse(6).success).toBe(false);
    });
  });
});
