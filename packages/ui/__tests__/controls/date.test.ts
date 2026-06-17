import { describe, expect, test } from "bun:test";
import type { DateControl } from "@imminently/interview-sdk";
import { parseDateControl } from "../../src/components/controls/DateControl";

const base: DateControl = { type: "date", id: "dob", attribute: "dob" };

describe("parseDateControl", () => {
  describe("value conversion", () => {
    test("converts a YYYY-MM-DD string to formatted date", () => {
      const result = parseDateControl({ ...base, value: "2024-03-15" });
      expect(result.value).toBe("2024-03-15");
    });

    test("passes undefined value through", () => {
      expect(parseDateControl({ ...base, value: undefined }).value).toBeUndefined();
    });

    test("passes null-ish (empty) value through", () => {
      expect(parseDateControl({ ...base }).value).toBeUndefined();
    });

    test("converts 'now' to today's date in YYYY-MM-DD", () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const expected = `${year}-${month}-${day}`;
      expect(parseDateControl({ ...base, value: "now" }).value).toBe(expected);
    });

    test("is case-insensitive for 'NOW'", () => {
      const result = parseDateControl({ ...base, value: "NOW" });
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("default conversion", () => {
    test("converts a YYYY-MM-DD default string", () => {
      expect(parseDateControl({ ...base, default: "2023-01-01" }).default).toBe("2023-01-01");
    });

    test("passes undefined default through", () => {
      expect(parseDateControl({ ...base, default: undefined }).default).toBeUndefined();
    });
  });

  describe("min and max conversion", () => {
    test("converts min and max date strings", () => {
      const result = parseDateControl({ ...base, min: "2020-01-01", max: "2030-12-31" });
      expect(result.min).toBe("2020-01-01");
      expect(result.max).toBe("2030-12-31");
    });

    test("passes undefined min and max through", () => {
      const result = parseDateControl({ ...base });
      expect(result.min).toBeUndefined();
      expect(result.max).toBeUndefined();
    });
  });

  describe("output format", () => {
    test("formats with zero-padded month and day", () => {
      expect(parseDateControl({ ...base, value: "2024-01-05" }).value).toBe("2024-01-05");
    });

    test("preserves other control fields", () => {
      const result = parseDateControl({ ...base, value: "2024-06-01", label: "Date of Birth", required: true });
      expect(result.label).toBe("Date of Birth");
      expect(result.required).toBe(true);
    });
  });
});
