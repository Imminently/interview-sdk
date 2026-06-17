import { describe, expect, test } from "bun:test";
import type { BooleanControl } from "@imminently/interview-sdk";
import { parseBooleanControl, toBool } from "../../src/components/controls/BooleanControl";

describe("toBool", () => {
  describe("null and undefined pass through", () => {
    test("returns null for null", () => {
      expect(toBool(null)).toBeNull();
    });

    test("returns undefined for undefined", () => {
      expect(toBool(undefined)).toBeUndefined();
    });
  });

  describe("boolean values pass through unchanged", () => {
    test("returns true for true", () => {
      expect(toBool(true)).toBe(true);
    });

    test("returns false for false", () => {
      expect(toBool(false)).toBe(false);
    });
  });

  describe("truthy coercions", () => {
    test("coerces string 'true' to true", () => {
      expect(toBool("true")).toBe(true);
    });

    test("coerces number 1 to true", () => {
      expect(toBool(1)).toBe(true);
    });

    test("coerces string '1' to true", () => {
      expect(toBool("1")).toBe(true);
    });
  });

  describe("falsy coercions", () => {
    test("coerces string 'false' to false", () => {
      expect(toBool("false")).toBe(false);
    });

    test("coerces number 0 to false", () => {
      expect(toBool(0)).toBe(false);
    });

    test("coerces string '0' to false", () => {
      expect(toBool("0")).toBe(false);
    });
  });

  describe("unknown values pass through as-is", () => {
    test("returns an unrecognised string unchanged", () => {
      expect(toBool("maybe") as unknown).toBe("maybe");
    });

    test("returns an unrecognised number unchanged", () => {
      expect(toBool(2) as unknown).toBe(2);
    });

    test("returns an object unchanged", () => {
      const obj = { x: 1 };
      expect(toBool(obj) as unknown).toBe(obj);
    });
  });
});

describe("parseBooleanControl", () => {
  const base: BooleanControl = { type: "boolean", id: "test", attribute: "test" };

  describe("value coercion", () => {
    test("passes true through unchanged", () => {
      expect(parseBooleanControl({ ...base, value: true }).value).toBe(true);
    });

    test("passes false through unchanged", () => {
      expect(parseBooleanControl({ ...base, value: false }).value).toBe(false);
    });

    test("passes null through unchanged", () => {
      expect(parseBooleanControl({ ...base, value: null }).value).toBeNull();
    });

    test("passes undefined through unchanged", () => {
      expect(parseBooleanControl({ ...base, value: undefined }).value).toBeUndefined();
    });

    test("coerces string 'true' to true", () => {
      expect(parseBooleanControl({ ...base, value: "true" as any }).value).toBe(true);
    });

    test("coerces string 'false' to false", () => {
      expect(parseBooleanControl({ ...base, value: "false" as any }).value).toBe(false);
    });

    test("coerces number 1 to true", () => {
      expect(parseBooleanControl({ ...base, value: 1 as any }).value).toBe(true);
    });

    test("coerces number 0 to false", () => {
      expect(parseBooleanControl({ ...base, value: 0 as any }).value).toBe(false);
    });

    test("coerces string '1' to true", () => {
      expect(parseBooleanControl({ ...base, value: "1" as any }).value).toBe(true);
    });

    test("coerces string '0' to false", () => {
      expect(parseBooleanControl({ ...base, value: "0" as any }).value).toBe(false);
    });

    test("passes an unknown value through as-is", () => {
      expect(parseBooleanControl({ ...base, value: "maybe" as any }).value as unknown).toBe("maybe");
    });
  });

  describe("default coercion", () => {
    test("coerces string 'true' default to true", () => {
      expect(parseBooleanControl({ ...base, default: "true" as any }).default).toBe(true);
    });

    test("coerces string 'false' default to false", () => {
      expect(parseBooleanControl({ ...base, default: "false" as any }).default).toBe(false);
    });

    test("passes null default unchanged", () => {
      expect(parseBooleanControl({ ...base, default: null }).default).toBeNull();
    });
  });

  describe("spreads control properties", () => {
    test("preserves other fields on the control object", () => {
      const result = parseBooleanControl({ ...base, value: true, label: "My field", required: true });
      expect(result.label).toBe("My field");
      expect(result.required).toBe(true);
      expect(result.id).toBe("test");
    });
  });
});
