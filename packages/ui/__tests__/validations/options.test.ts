import { describe, expect, test } from "bun:test";
import { optionsValidator } from "../../src/util/validation/options";

const base = { id: "ctrl-1", type: "options" as const, attribute: "attr-1" };

describe("optionsValidator", () => {
  describe("without constraints", () => {
    const schema = optionsValidator(base);

    test("accepts a string value", () => {
      expect(schema.safeParse("option-a").success).toBe(true);
    });

    test("accepts a number value", () => {
      expect(schema.safeParse(1).success).toBe(true);
    });

    test("accepts a boolean value", () => {
      expect(schema.safeParse(true).success).toBe(true);
    });

    test("accepts false", () => {
      expect(schema.safeParse(false).success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("rejects plain object", () => {
      expect(schema.safeParse({ value: "a" }).success).toBe(false);
    });

    test("rejects array", () => {
      expect(schema.safeParse(["a", "b"]).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = optionsValidator({ ...base, required: true });

    test("accepts string value", () => {
      expect(schema.safeParse("selected").success).toBe(true);
    });

    test("accepts number value", () => {
      expect(schema.safeParse(42).success).toBe(true);
    });

    test("accepts boolean value", () => {
      expect(schema.safeParse(true).success).toBe(true);
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

    test("rejects empty string", () => {
      const result = schema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please fill out this field");
      }
    });

    test("rejects object", () => {
      expect(schema.safeParse({ id: 1 }).success).toBe(false);
    });
  });
});
