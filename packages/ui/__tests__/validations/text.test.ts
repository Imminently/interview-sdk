import { describe, expect, test } from "bun:test";
import { textValidator } from "../../src/util/validation/text";

const base = { id: "ctrl-1", type: "text" as const, attribute: "attr-1" };

describe("textValidator", () => {
  describe("without constraints", () => {
    const schema = textValidator(base);

    test("accepts a string", () => {
      expect(schema.safeParse("hello").success).toBe(true);
    });

    test("accepts empty string", () => {
      expect(schema.safeParse("").success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("rejects number", () => {
      expect(schema.safeParse(42).success).toBe(false);
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });

    test("rejects object", () => {
      expect(schema.safeParse({ text: "hi" }).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = textValidator({ ...base, required: true });

    test("accepts non-empty string", () => {
      expect(schema.safeParse("hello").success).toBe(true);
    });

    test("rejects empty string", () => {
      const result = schema.safeParse("");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please fill out this field");
      }
    });

    test("rejects null", () => {
      expect(schema.safeParse(null).success).toBe(false);
    });

    test("rejects undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(false);
    });

    test("rejects number instead of string", () => {
      expect(schema.safeParse(42).success).toBe(false);
    });
  });

  describe("with variation: number", () => {
    const schema = textValidator({ ...base, variation: { type: "number" } });

    test("accepts numeric string", () => {
      expect(schema.safeParse("42").success).toBe(true);
    });

    test("accepts negative numeric string", () => {
      expect(schema.safeParse("-10").success).toBe(true);
    });

    test("accepts decimal numeric string", () => {
      expect(schema.safeParse("3.14").success).toBe(true);
    });

    test("accepts empty string (not required)", () => {
      expect(schema.safeParse("").success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("rejects alphabetic string", () => {
      const result = schema.safeParse("abc");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please input valid number");
      }
    });

    test("rejects alphanumeric string", () => {
      expect(schema.safeParse("12abc").success).toBe(false);
    });

    test("rejects actual number type", () => {
      // The variation expects a string representation of a number
      expect(schema.safeParse(42).success).toBe(false);
    });
  });

  describe("with variation: email", () => {
    const schema = textValidator({ ...base, variation: { type: "email" } });

    test("accepts valid email", () => {
      expect(schema.safeParse("user@example.com").success).toBe(true);
    });

    test("accepts empty string (not required)", () => {
      expect(schema.safeParse("").success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("rejects string without @", () => {
      const result = schema.safeParse("notanemail");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please provide valid email");
      }
    });

    test("rejects string missing domain", () => {
      expect(schema.safeParse("user@").success).toBe(false);
    });

    test("rejects number", () => {
      expect(schema.safeParse(123).success).toBe(false);
    });
  });

  describe("with max length", () => {
    const schema = textValidator({ ...base, max: 10 });

    test("accepts string within max", () => {
      expect(schema.safeParse("hello").success).toBe(true);
    });

    test("accepts string exactly at max", () => {
      expect(schema.safeParse("1234567890").success).toBe(true);
    });

    test("rejects string exceeding max", () => {
      const result = schema.safeParse("12345678901");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("This must be at most 10 characters");
      }
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts empty string", () => {
      expect(schema.safeParse("").success).toBe(true);
    });
  });
});
