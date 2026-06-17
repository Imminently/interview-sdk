import { describe, expect, test } from "bun:test";
import { timeValidator } from "../../src/util/validation/time";

const base = { id: "ctrl-1", type: "time" as const, attribute: "attr-1" };

describe("timeValidator", () => {
  describe("without constraints", () => {
    const schema = timeValidator(base);

    test("accepts HH:mm string", () => {
      expect(schema.safeParse("10:30").success).toBe(true);
    });

    test("accepts HH:mm:ss string", () => {
      expect(schema.safeParse("10:30:00").success).toBe(true);
    });

    test("accepts midnight", () => {
      expect(schema.safeParse("00:00").success).toBe(true);
    });

    test("accepts end of day", () => {
      expect(schema.safeParse("23:59").success).toBe(true);
    });

    test("accepts a Date object", () => {
      expect(schema.safeParse(new Date("1970-01-01T10:30:00")).success).toBe(true);
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

    test("rejects arbitrary string", () => {
      const result = schema.safeParse("not-a-time");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please specify a valid time");
      }
    });

    test("accepts number interpreted as HHMM (1030 → 10:30)", () => {
      // timeToSeconds now parses bare digit inputs as HHMM
      expect(schema.safeParse(1030).success).toBe(true);
    });

    test("rejects boolean", () => {
      expect(schema.safeParse(true).success).toBe(false);
    });
  });

  describe("with required: true", () => {
    const schema = timeValidator({ ...base, required: true });

    test("accepts valid time", () => {
      expect(schema.safeParse("09:00").success).toBe(true);
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

  describe("with max time", () => {
    // min/max are ISO datetime strings; timeToSeconds parses the time component
    const schema = timeValidator({ ...base, max: "17:00:00" });

    test("accepts time at max", () => {
      expect(schema.safeParse("17:00").success).toBe(true);
    });

    test("accepts time before max", () => {
      expect(schema.safeParse("09:00").success).toBe(true);
    });

    test("rejects time after max", () => {
      const result = schema.safeParse("18:00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Should be before or equal to");
      }
    });
  });

  describe("with min time", () => {
    const schema = timeValidator({ ...base, min: "09:00:00" });

    test("accepts time at min", () => {
      expect(schema.safeParse("09:00").success).toBe(true);
    });

    test("accepts time after min", () => {
      expect(schema.safeParse("12:00").success).toBe(true);
    });

    test("rejects time before min", () => {
      const result = schema.safeParse("08:00");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Should be after or equal to");
      }
    });
  });

  describe("with amPmFormat", () => {
    const schema = timeValidator({ ...base, amPmFormat: true });

    test("accepts 12-hour AM string", () => {
      expect(schema.safeParse("09:00 AM").success).toBe(true);
    });

    test("accepts 12-hour PM string", () => {
      expect(schema.safeParse("02:30 PM").success).toBe(true);
    });

    test("accepts 24-hour string (also valid via HH:mm regex)", () => {
      expect(schema.safeParse("14:30").success).toBe(true);
    });
  });
});
