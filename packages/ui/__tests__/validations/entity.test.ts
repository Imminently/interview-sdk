import { describe, expect, test } from "bun:test";
import { entityValidator } from "../../src/util/validation/entity";

const base = {
  id: "ctrl-1",
  type: "entity" as const,
  attribute: "attr-1",
  // RenderableEntityControl requires template and controls, but the
  // validator only reads min/max so a cast suffices for testing
} as any;

describe("entityValidator", () => {
  describe("without min or max", () => {
    test("returns undefined (no schema needed)", () => {
      expect(entityValidator(base)).toBeUndefined();
    });
  });

  describe("with min only", () => {
    const schema = entityValidator({ ...base, min: 2 })!;

    test("accepts array meeting min", () => {
      expect(schema.safeParse(["a", "b"]).success).toBe(true);
    });

    test("accepts array exceeding min", () => {
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);
    });

    test("rejects array below min", () => {
      const result = schema.safeParse(["a"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must have at least 2 items");
      }
    });

    test("rejects empty array", () => {
      expect(schema.safeParse([]).success).toBe(false);
    });

    test("singular 'item' message when min is 1", () => {
      const s = entityValidator({ ...base, min: 1 })!;
      const result = s.safeParse([]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must have at least 1 item");
      }
    });

    test("treats non-array as length 0", () => {
      // null/undefined are treated as length 0
      expect(schema.safeParse(null).success).toBe(false);
    });
  });

  describe("with max only", () => {
    const schema = entityValidator({ ...base, max: 3 })!;

    test("accepts array at max", () => {
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);
    });

    test("accepts array below max", () => {
      expect(schema.safeParse(["a"]).success).toBe(true);
    });

    test("accepts empty array", () => {
      expect(schema.safeParse([]).success).toBe(true);
    });

    test("rejects array exceeding max", () => {
      const result = schema.safeParse(["a", "b", "c", "d"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must have at most 3 items");
      }
    });

    test("singular 'item' message when max is 1", () => {
      const s = entityValidator({ ...base, max: 1 })!;
      const result = s.safeParse(["a", "b"]);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must have at most 1 item");
      }
    });
  });

  describe("with both min and max", () => {
    const schema = entityValidator({ ...base, min: 1, max: 5 })!;

    test("accepts array within range", () => {
      expect(schema.safeParse(["a", "b", "c"]).success).toBe(true);
    });

    test("rejects empty array (below min)", () => {
      expect(schema.safeParse([]).success).toBe(false);
    });

    test("rejects array exceeding max", () => {
      expect(schema.safeParse(["a", "b", "c", "d", "e", "f"]).success).toBe(false);
    });
  });
});
