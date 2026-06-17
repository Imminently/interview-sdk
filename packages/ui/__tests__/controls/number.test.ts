import { describe, expect, test } from "bun:test";
import type { NumberControl } from "@imminently/interview-sdk";
import { parseNumberControl } from "../../src/components/controls/NumberControl";

const base: NumberControl = { type: "number", id: "age", attribute: "age" };

describe("parseNumberControl", () => {
  describe("value coercion", () => {
    test("passes a number through unchanged", () => {
      expect(parseNumberControl({ ...base, value: 42 }).value).toBe(42);
    });

    test("passes 0 through unchanged", () => {
      expect(parseNumberControl({ ...base, value: 0 }).value).toBe(0);
    });

    test("passes negative numbers through unchanged", () => {
      expect(parseNumberControl({ ...base, value: -5 }).value).toBe(-5);
    });

    test("passes null through unchanged", () => {
      expect(parseNumberControl({ ...base, value: null }).value).toBeNull();
    });

    test("passes undefined through unchanged", () => {
      expect(parseNumberControl({ ...base, value: undefined }).value).toBeUndefined();
    });

    test("coerces a numeric string to a number", () => {
      expect(parseNumberControl({ ...base, value: "7" as any }).value).toBe(7);
    });

    test("coerces a decimal string to a number", () => {
      expect(parseNumberControl({ ...base, value: "3.14" as any }).value).toBe(3.14);
    });

    test("returns undefined for a non-numeric string", () => {
      expect(parseNumberControl({ ...base, value: "abc" as any }).value).toBeUndefined();
    });

    test("coerces an empty string to 0 (Number('') === 0)", () => {
      expect(parseNumberControl({ ...base, value: "" as any }).value).toBe(0);
    });
  });

  describe("default coercion", () => {
    test("coerces a numeric string default", () => {
      expect(parseNumberControl({ ...base, default: "100" as any }).default).toBe(100);
    });

    test("passes null default unchanged", () => {
      expect(parseNumberControl({ ...base, default: null }).default).toBeNull();
    });

    test("passes undefined default unchanged", () => {
      expect(parseNumberControl({ ...base, default: undefined }).default).toBeUndefined();
    });
  });

  describe("spreads control properties", () => {
    test("preserves other fields on the control object", () => {
      const result = parseNumberControl({ ...base, value: 5, label: "Age", required: true });
      expect(result.label).toBe("Age");
      expect(result.required).toBe(true);
    });
  });
});
