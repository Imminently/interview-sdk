import { describe, expect, test } from "bun:test";
import { normalizeMinutesIncrement } from "../../src/components/controls/TimeControl";

describe("normalizeMinutesIncrement", () => {
  test("normalizes numeric strings", () => {
    expect(normalizeMinutesIncrement("15")).toBe(15);
  });

  test("preserves positive numbers", () => {
    expect(normalizeMinutesIncrement(30)).toBe(30);
  });

  test("rejects empty, invalid, and non-positive values", () => {
    expect(normalizeMinutesIncrement("")).toBeUndefined();
    expect(normalizeMinutesIncrement("invalid")).toBeUndefined();
    expect(normalizeMinutesIncrement(0)).toBeUndefined();
    expect(normalizeMinutesIncrement(-5)).toBeUndefined();
  });
});
