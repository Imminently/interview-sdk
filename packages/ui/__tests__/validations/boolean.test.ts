import { describe, expect, test } from "bun:test";
import { booleanValidator } from "../../src/util/validation/boolean";

const base = { id: "ctrl-1", type: "boolean" as const, attribute: "attr-1" };

describe("booleanValidator", () => {
  describe("without required", () => {
    const schema = booleanValidator(base);

    test("accepts true", () => {
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

    test("rejects string 'true'", () => {
      expect(schema.safeParse("true").success).toBe(false);
    });

    test("rejects string 'false'", () => {
      expect(schema.safeParse("false").success).toBe(false);
    });

    test("rejects number 1", () => {
      expect(schema.safeParse(1).success).toBe(false);
    });

    test("rejects number 0", () => {
      expect(schema.safeParse(0).success).toBe(false);
    });

    test("rejects object", () => {
      expect(schema.safeParse({}).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = booleanValidator({ ...base, required: true });

    test("accepts true", () => {
      expect(schema.safeParse(true).success).toBe(true);
    });

    test("accepts false (user explicitly unchecked)", () => {
      expect(schema.safeParse(false).success).toBe(true);
    });

    test("accepts null (user explicitly cleared)", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("rejects undefined (no answer given)", () => {
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("This must be checked or unchecked");
      }
    });

    test("rejects string", () => {
      expect(schema.safeParse("yes").success).toBe(false);
    });
  });
});
