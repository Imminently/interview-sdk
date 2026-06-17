import { describe, expect, test } from "bun:test";
import { getDefaultValue } from "../../src/interview/InterviewControl";

describe("getDefaultValue", () => {
  describe("value takes highest precedence", () => {
    test("returns value when both value and default are set", () => {
      expect(getDefaultValue({ value: "a", default: "b" })).toBe("a");
    });

    test("returns value when only value is set", () => {
      expect(getDefaultValue({ value: 42 })).toBe(42);
    });

    test("returns null value (not skipping it for default)", () => {
      expect(getDefaultValue({ value: null, default: "fallback" })).toBeNull();
    });

    test("returns false value (not skipping it)", () => {
      expect(getDefaultValue({ value: false, default: true })).toBe(false);
    });

    test("returns 0 value (not skipping it)", () => {
      expect(getDefaultValue({ value: 0, default: 1 })).toBe(0);
    });
  });

  describe("default is used when value is absent", () => {
    test("returns default when value is undefined and default is set", () => {
      expect(getDefaultValue({ default: "d" })).toBe("d");
    });

    test("returns null default when value is undefined", () => {
      expect(getDefaultValue({ value: undefined, default: null })).toBeNull();
    });

    test("returns false default when value is undefined", () => {
      expect(getDefaultValue({ value: undefined, default: false })).toBe(false);
    });
  });

  describe("fallback when both value and default are absent", () => {
    test("returns undefined in non-strict mode", () => {
      expect(getDefaultValue({})).toBeUndefined();
    });

    test("returns null in strict mode", () => {
      expect(getDefaultValue({}, true)).toBeNull();
    });
  });

  describe("strict mode", () => {
    test("strict mode does not affect the result when value is set", () => {
      expect(getDefaultValue({ value: "x" }, true)).toBe("x");
    });

    test("strict mode does not affect the result when default is set", () => {
      expect(getDefaultValue({ default: "d" }, true)).toBe("d");
    });

    test("strict mode returns null when both are absent", () => {
      expect(getDefaultValue({ value: undefined, default: undefined }, true)).toBeNull();
    });

    test("non-strict mode returns undefined when both are absent", () => {
      expect(getDefaultValue({ value: undefined, default: undefined }, false)).toBeUndefined();
    });
  });
});
