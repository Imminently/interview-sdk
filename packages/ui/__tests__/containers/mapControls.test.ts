import { describe, expect, test } from "bun:test";
import type { TextControl } from "@imminently/interview-sdk";
import { mapControls } from "../../src/util/container-utils";

const ctrl = (id: string, attribute?: string): TextControl =>
  ({ id, type: "text", attribute }) as unknown as TextControl;

describe("mapControls", () => {
  describe("no attribute (no remapping)", () => {
    test("returns controls unchanged when attribute is undefined", () => {
      const controls = [ctrl("a", "uuid-a"), ctrl("b", "uuid-b")];
      expect(mapControls(controls, undefined)).toBe(controls);
    });
  });

  describe("flat attribute (no parent path)", () => {
    test("returns controls unchanged when attribute has no parent path segments", () => {
      const controls = [ctrl("a", "uuid-a")];
      const result = mapControls(controls, "uuid-root");
      expect(result).toBe(controls);
    });
  });

  describe("nested attribute with dot-separated path", () => {
    test("prepends parent path to child attribute", () => {
      const controls = [ctrl("child", "child-uuid")];
      const result = mapControls(controls, "parent-uuid.current-uuid");
      expect(result[0].attribute).toBe("parent-uuid.child-uuid");
    });

    test("leaves already-pathed child attributes unchanged", () => {
      const controls = [ctrl("child", "parent-uuid.child-uuid")];
      const result = mapControls(controls, "parent-uuid.current-uuid");
      expect(result[0].attribute).toBe("parent-uuid.child-uuid");
    });

    test("leaves controls without an attribute unchanged", () => {
      const controls = [ctrl("no-attr")];
      const result = mapControls(controls, "parent-uuid.current-uuid");
      expect(result[0].attribute).toBeUndefined();
    });

    test("maps multiple controls independently", () => {
      const controls = [ctrl("a", "uuid-a"), ctrl("b", "uuid-b")];
      const result = mapControls(controls, "parent.current");
      expect(result[0].attribute).toBe("parent.uuid-a");
      expect(result[1].attribute).toBe("parent.uuid-b");
    });

    test("does not mutate the original control objects", () => {
      const controls = [ctrl("a", "uuid-a")];
      const result = mapControls(controls, "parent.current");
      expect(result[0]).not.toBe(controls[0]);
      expect(controls[0].attribute).toBe("uuid-a");
    });
  });

  describe("nested attribute with slash-separated path", () => {
    test("prepends parent path using slash separator", () => {
      const controls = [ctrl("child", "child-uuid")];
      const result = mapControls(controls, "parent-uuid/current-uuid");
      expect(result[0].attribute).toBe("parent-uuid/child-uuid");
    });

    test("leaves slash-path child attributes unchanged", () => {
      const controls = [ctrl("child", "parent-uuid/child-uuid")];
      const result = mapControls(controls, "parent-uuid/current-uuid");
      expect(result[0].attribute).toBe("parent-uuid/child-uuid");
    });
  });

  describe("empty controls array", () => {
    test("returns an empty array", () => {
      expect(mapControls([], "parent.current")).toEqual([]);
    });
  });
});
