import { describe, expect, test } from "bun:test";
import { dateValidator } from "../../src/util/validation/date";

const base = { id: "ctrl-1", type: "date" as const, attribute: "attr-1" };

describe("dateValidator", () => {
  describe("without constraints", () => {
    const schema = dateValidator(base);

    test("accepts a valid YYYY-MM-DD string", () => {
      expect(schema.safeParse("2024-06-15").success).toBe(true);
    });

    test("accepts null", () => {
      expect(schema.safeParse(null).success).toBe(true);
    });

    test("accepts undefined", () => {
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    test("accepts empty string", () => {
      expect(schema.safeParse("").success).toBe(true);
    });

    test("rejects DD/MM/YYYY format", () => {
      const result = schema.safeParse("15/06/2024");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be formatted like YYYY-MM-DD");
      }
    });

    test("rejects MM-DD-YYYY format", () => {
      expect(schema.safeParse("06-15-2024").success).toBe(false);
    });

    test("rejects invalid date (month 13)", () => {
      expect(schema.safeParse("2024-13-01").success).toBe(false);
    });

    test("rejects ISO datetime string", () => {
      // Extra time component makes it not match YYYY-MM-DD exactly
      expect(schema.safeParse("2024-06-15T10:00:00").success).toBe(false);
    });

    test("rejects plain number", () => {
      expect(schema.safeParse(20240615).success).toBe(false);
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = dateValidator({ ...base, required: true });

    test("accepts valid date", () => {
      expect(schema.safeParse("2024-01-01").success).toBe(true);
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
  });

  describe("with max date", () => {
    const schema = dateValidator({ ...base, max: "2024-12-31" });

    test("accepts date before max", () => {
      expect(schema.safeParse("2024-06-01").success).toBe(true);
    });

    test("accepts date equal to max", () => {
      expect(schema.safeParse("2024-12-31").success).toBe(true);
    });

    test("rejects date after max", () => {
      const result = schema.safeParse("2025-01-01");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be before or equal to 2024-12-31");
      }
    });
  });

  describe("with min date", () => {
    const schema = dateValidator({ ...base, min: "2024-01-01" });

    test("accepts date after min", () => {
      expect(schema.safeParse("2024-06-01").success).toBe(true);
    });

    test("accepts date equal to min", () => {
      expect(schema.safeParse("2024-01-01").success).toBe(true);
    });

    test("rejects date before min", () => {
      const result = schema.safeParse("2023-12-31");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Should be after or equal to 2024-01-01");
      }
    });
  });

  describe("with both min and max", () => {
    const schema = dateValidator({ ...base, min: "2024-01-01", max: "2024-12-31" });

    test("accepts date within range", () => {
      expect(schema.safeParse("2024-06-15").success).toBe(true);
    });

    test("rejects date before min", () => {
      expect(schema.safeParse("2023-12-31").success).toBe(false);
    });

    test("rejects date after max", () => {
      expect(schema.safeParse("2025-01-01").success).toBe(false);
    });
  });
});
