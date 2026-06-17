import { describe, expect, test } from "bun:test";
import { parseControl } from "../../src/components/parseControl";

describe("parseControl", () => {
  test("delegates boolean type to parseBooleanControl", () => {
    const result = parseControl({ type: "boolean", id: "b", value: "true" });
    expect(result.value).toBe(true);
  });

  test("delegates currency type to parseCurrencyControl", () => {
    const result = parseControl({ type: "currency", id: "c", value: "9.99" });
    expect(result.value).toBe(9.99);
  });

  test("delegates date type to parseDateControl", () => {
    const result = parseControl({ type: "date", id: "d", value: "2024-06-01" });
    expect(result.value).toBe("2024-06-01");
  });

  test("delegates number type to parseNumberControl", () => {
    const result = parseControl({ type: "number", id: "n", value: "42" });
    expect(result.value).toBe(42);
  });

  test("delegates number_of_instances type to parseNumberOfInstancesControl", () => {
    const result = parseControl({ type: "number_of_instances", id: "noi", entity: "item", value: "3" });
    expect(result.value).toBe(3);
  });

  describe("options with asRadio", () => {
    test("delegates to parseRadioControl when asRadio is true", () => {
      const result = parseControl({ type: "options", id: "o", asRadio: true, value: "null" });
      expect(result.value).toBeNull();
    });

    test("returns the control unchanged when asRadio is false", () => {
      const control = { type: "options", id: "o", asRadio: false, value: "x" };
      expect(parseControl(control)).toBe(control);
    });

    test("returns the control unchanged when asRadio is not set", () => {
      const control = { type: "options", id: "o", value: "x" };
      expect(parseControl(control)).toBe(control);
    });
  });

  describe("default passthrough", () => {
    test("returns the control unchanged for text type", () => {
      const control = { type: "text", id: "t", value: "hello" };
      expect(parseControl(control)).toBe(control);
    });

    test("returns the control unchanged for an unknown type", () => {
      const control = { type: "unknown_type", id: "x" };
      expect(parseControl(control)).toBe(control);
    });
  });
});
