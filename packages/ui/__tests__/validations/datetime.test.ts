import { describe, expect, test } from "bun:test";
import { datetimeValidator } from "../../src/util/validation/datetime";

const base = { id: "ctrl-1", type: "datetime" as const, attribute: "attr-1" };

// An ISO datetime string that is unambiguously parseable
const VALID_DT = "2024-06-15T10:30:00";

describe("datetimeValidator", () => {
  describe("without constraints", () => {
    const schema = datetimeValidator(base);

    test("accepts ISO datetime string", () => {
      expect(schema.safeParse(VALID_DT).success).toBe(true);
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

    test("accepts a Date object (coerced via string cast)", () => {
      // The validator casts the value with new Date(v), so a Date object works
      expect(schema.safeParse(new Date(VALID_DT)).success).toBe(true);
    });
  });

  describe("with required: true", () => {
    const schema = datetimeValidator({ ...base, required: true });

    test("accepts valid datetime", () => {
      expect(schema.safeParse(VALID_DT).success).toBe(true);
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

  describe("with date_max", () => {
    const schema = datetimeValidator({ ...base, date_max: "2024-12-31" });

    test("accepts datetime with date on max", () => {
      expect(schema.safeParse("2024-12-31T10:00:00").success).toBe(true);
    });

    test("accepts datetime with date before max", () => {
      expect(schema.safeParse("2024-06-01T10:00:00").success).toBe(true);
    });

    test("rejects datetime with date after max", () => {
      const result = schema.safeParse("2025-01-01T10:00:00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Date should be before or equal to 2024-12-31");
      }
    });
  });

  describe("with date_min", () => {
    const schema = datetimeValidator({ ...base, date_min: "2024-01-01" });

    test("accepts datetime with date on min", () => {
      expect(schema.safeParse("2024-01-01T00:00:00").success).toBe(true);
    });

    test("accepts datetime with date after min", () => {
      expect(schema.safeParse("2024-06-15T10:00:00").success).toBe(true);
    });

    test("rejects datetime with date before min", () => {
      const result = schema.safeParse("2023-12-31T23:59:59");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Date should be after or equal to 2024-01-01");
      }
    });
  });

  describe("with time_max", () => {
    // time_max is an HH:mm:ss string
    const schema = datetimeValidator({ ...base, time_max: "17:00:00" });

    test("accepts time at max", () => {
      expect(schema.safeParse("2024-06-15T17:00:00").success).toBe(true);
    });

    test("accepts time before max", () => {
      expect(schema.safeParse("2024-06-15T09:00:00").success).toBe(true);
    });

    test("rejects time after max", () => {
      const result = schema.safeParse("2024-06-15T18:00:00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Time should be before or equal to");
      }
    });
  });

  describe("with time_min", () => {
    const schema = datetimeValidator({ ...base, time_min: "09:00:00" });

    test("accepts time at min", () => {
      expect(schema.safeParse("2024-06-15T09:00:00").success).toBe(true);
    });

    test("accepts time after min", () => {
      expect(schema.safeParse("2024-06-15T12:00:00").success).toBe(true);
    });

    test("rejects time before min", () => {
      const result = schema.safeParse("2024-06-15T08:00:00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Time should be after or equal to");
      }
    });
  });

  describe("with combined date and time constraints", () => {
    const schema = datetimeValidator({
      ...base,
      date_min: "2024-01-01",
      date_max: "2024-12-31",
      time_min: "09:00:00",
      time_max: "17:00:00",
    });

    test("accepts datetime within all constraints", () => {
      expect(schema.safeParse("2024-06-15T12:00:00").success).toBe(true);
    });

    test("rejects date out of range", () => {
      expect(schema.safeParse("2025-06-15T12:00:00").success).toBe(false);
    });

    test("rejects time out of range", () => {
      expect(schema.safeParse("2024-06-15T20:00:00").success).toBe(false);
    });
  });
});
