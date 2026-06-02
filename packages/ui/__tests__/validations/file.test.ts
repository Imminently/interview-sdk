import { describe, expect, test } from "bun:test";
import { fileValidator } from "../../src/util/validation/file";

const base = { id: "ctrl-1", type: "file" as const, attribute: "attr-1" };

describe("fileValidator", () => {
  describe("without required", () => {
    test("returns undefined (no schema needed)", () => {
      expect(fileValidator(base)).toBeUndefined();
    });

    test("returns undefined when required is false", () => {
      expect(fileValidator({ ...base, required: false as any })).toBeUndefined();
    });
  });

  describe("with required: true", () => {
    const schema = fileValidator({ ...base, required: true })!;

    test("accepts a file value with fileRefs", () => {
      expect(schema.safeParse({ fileRefs: ["file-id-1"] }).success).toBe(true);
    });

    test("accepts a file value with multiple fileRefs", () => {
      expect(schema.safeParse({ fileRefs: ["ref-1", "ref-2"] }).success).toBe(true);
    });

    test("rejects empty fileRefs array", () => {
      const result = schema.safeParse({ fileRefs: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Required");
      }
    });

    test("rejects null", () => {
      const result = schema.safeParse(null);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Required");
      }
    });

    test("rejects undefined", () => {
      const result = schema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    test("rejects object without fileRefs — validator throws TypeError", () => {
      // The validator accesses v.fileRefs directly without a type guard,
      // so non-file objects throw rather than returning a zod failure.
      expect(() => schema.safeParse({ name: "file.pdf" })).toThrow(TypeError);
    });

    test("rejects string — validator throws TypeError", () => {
      expect(() => schema.safeParse("file-id")).toThrow(TypeError);
    });

    test("rejects number — validator throws TypeError", () => {
      expect(() => schema.safeParse(42)).toThrow(TypeError);
    });
  });
});
