import { describe, expect, test } from "bun:test";
import type { CurrencyControl } from "@imminently/interview-sdk";
import { parseCurrencyControl } from "../../src/components/controls/CurrencyControl";

const base: CurrencyControl = { type: "currency", id: "price", attribute: "price" };

describe("parseCurrencyControl", () => {
  describe("value coercion", () => {
    test("passes a number through unchanged", () => {
      expect(parseCurrencyControl({ ...base, value: 9.99 }).value).toBe(9.99);
    });

    test("passes 0 through unchanged", () => {
      expect(parseCurrencyControl({ ...base, value: 0 }).value).toBe(0);
    });

    test("passes null through unchanged", () => {
      expect(parseCurrencyControl({ ...base, value: null }).value).toBeNull();
    });

    test("passes undefined through unchanged", () => {
      expect(parseCurrencyControl({ ...base, value: undefined }).value).toBeUndefined();
    });

    test("coerces a numeric string to a number", () => {
      expect(parseCurrencyControl({ ...base, value: "42.5" as any }).value).toBe(42.5);
    });

    test("returns undefined for a non-numeric string", () => {
      expect(parseCurrencyControl({ ...base, value: "abc" as any }).value).toBeUndefined();
    });

    test("coerces an empty string to 0 (Number('') === 0)", () => {
      expect(parseCurrencyControl({ ...base, value: "" as any }).value).toBe(0);
    });
  });

  describe("default coercion", () => {
    test("coerces a numeric string default", () => {
      expect(parseCurrencyControl({ ...base, default: "10" as any }).default).toBe(10);
    });

    test("passes null default unchanged", () => {
      expect(parseCurrencyControl({ ...base, default: null }).default).toBeNull();
    });
  });

  describe("spreads control properties", () => {
    test("preserves other fields on the control object", () => {
      const result = parseCurrencyControl({ ...base, value: 5, symbol: "$", label: "Price" });
      expect(result.symbol).toBe("$");
      expect(result.label).toBe("Price");
    });
  });
});
