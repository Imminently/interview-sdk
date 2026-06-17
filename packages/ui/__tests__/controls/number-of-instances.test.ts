import { describe, expect, test } from "bun:test";
import type { NumberOfInstancesControl } from "@imminently/interview-sdk";
import { parseNumberOfInstancesControl } from "../../src/components/controls/NumberOfInstancesControl";

const base: NumberOfInstancesControl = { type: "number_of_instances", id: "pets", entity: "pet", attribute: "pets" };

describe("parseNumberOfInstancesControl", () => {
  describe("value coercion", () => {
    test("passes a number through unchanged", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: 3 as any }).value as unknown).toBe(3);
    });

    test("passes 0 through unchanged", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: 0 as any }).value as unknown).toBe(0);
    });

    test("passes null through unchanged", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: null }).value).toBeNull();
    });

    test("passes undefined through unchanged", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: undefined }).value).toBeUndefined();
    });

    test("coerces a numeric string count to a number", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: "2" as any }).value as unknown).toBe(2);
    });

    test("returns undefined for a non-numeric string", () => {
      expect(parseNumberOfInstancesControl({ ...base, value: "abc" as any }).value as unknown).toBeUndefined();
    });
  });

  describe("default coercion", () => {
    test("coerces a numeric string default", () => {
      expect(parseNumberOfInstancesControl({ ...base, default: "1" as any }).default as unknown).toBe(1);
    });

    test("passes null default unchanged", () => {
      expect(parseNumberOfInstancesControl({ ...base, default: null as any }).default as unknown).toBeNull();
    });
  });

  describe("spreads control properties", () => {
    test("preserves entity and other fields", () => {
      const result = parseNumberOfInstancesControl({ ...base, value: 2 as any, label: "Number of pets" });
      expect(result.entity).toBe("pet");
      expect(result.label).toBe("Number of pets");
    });
  });
});
