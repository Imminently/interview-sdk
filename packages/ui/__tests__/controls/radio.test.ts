import { describe, expect, test } from "bun:test";
import type { OptionsControl } from "@imminently/interview-sdk";
import { parseRadioControl } from "../../src/components/controls/RadioControl";

const base: OptionsControl = {
  type: "options",
  id: "color",
  attribute: "color",
  asRadio: true,
  options: [
    { label: "Red", value: "red" },
    { label: "None", value: "null" },
  ],
};

describe("parseRadioControl", () => {
  describe("value coercion", () => {
    test("passes a normal string value through unchanged", () => {
      expect(parseRadioControl({ ...base, value: "red" }).value).toBe("red");
    });

    test("converts the string 'null' value to null", () => {
      expect(parseRadioControl({ ...base, value: "null" }).value).toBeNull();
    });

    test("passes null through unchanged", () => {
      expect(parseRadioControl({ ...base, value: null }).value).toBeNull();
    });

    test("passes undefined through unchanged", () => {
      expect(parseRadioControl({ ...base, value: undefined }).value).toBeUndefined();
    });
  });

  describe("default coercion", () => {
    test("converts the string 'null' default to null", () => {
      expect(parseRadioControl({ ...base, default: "null" }).default).toBeNull();
    });

    test("passes a normal string default through unchanged", () => {
      expect(parseRadioControl({ ...base, default: "red" }).default).toBe("red");
    });

    test("passes null default unchanged", () => {
      expect(parseRadioControl({ ...base, default: null }).default).toBeNull();
    });

    test("passes undefined default unchanged", () => {
      expect(parseRadioControl({ ...base, default: undefined }).default).toBeUndefined();
    });
  });

  describe("options array", () => {
    test("does not mutate the options array", () => {
      const result = parseRadioControl({ ...base, value: "null" });
      expect(result.options![1].value).toBe("null");
    });
  });

  describe("spreads control properties", () => {
    test("preserves other fields on the control object", () => {
      const result = parseRadioControl({ ...base, value: "red", label: "Favourite colour" });
      expect(result.label).toBe("Favourite colour");
      expect(result.asRadio).toBe(true);
    });
  });
});
