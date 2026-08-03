import { describe, expect, test } from "bun:test";
import { isReadOnly } from "../../src/components/controls/ReadOnlyControl";

describe("isReadOnly", () => {
  const readOnlyTypes = [
    "boolean",
    "currency",
    "date",
    "time",
    "datetime",
    "options",
    "number_of_instances",
    "text",
    "file",
    "number",
  ] as const;

  describe("supported control types", () => {
    for (const type of readOnlyTypes) {
      test(`returns false when readOnly is not set on ${type}`, () => {
        expect(isReadOnly({ type, id: "x" } as any)).toBe(false);
      });

      test(`returns true when readOnly is true on ${type}`, () => {
        expect(isReadOnly({ type, id: "x", readOnly: true } as any)).toBe(true);
      });

      test(`returns false when readOnly is false on ${type}`, () => {
        expect(isReadOnly({ type, id: "x", readOnly: false } as any)).toBe(false);
      });
    }
  });

  describe("unsupported control types always return false", () => {
    const unsupportedTypes = [
      "typography",
      "image",
      "document",
      "generative_chat",
      "entity",
      "interview_container",
      "switch_container",
      "repeating_container",
      "data_container",
      "certainty_container",
      "markdown",
    ];

    for (const type of unsupportedTypes) {
      test(`returns false for ${type} even when readOnly is true`, () => {
        expect(isReadOnly({ type, id: "x", readOnly: true } as any)).toBe(false);
      });
    }
  });

  describe("readOnly defaults", () => {
    test("returns false when readOnly is undefined (nullish coalescing)", () => {
      expect(isReadOnly({ type: "text", id: "x" } as any)).toBe(false);
    });
  });
});
