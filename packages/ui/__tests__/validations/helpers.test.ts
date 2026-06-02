import { describe, expect, test } from "bun:test";
import { timeToSeconds } from "../../src/util/validation/helpers";

// Convenience: seconds since midnight for a given HH:MM
const hhmm = (h: number, m: number) => h * 3600 + m * 60;

describe("timeToSeconds", () => {
  describe("empty / nullish values → NaN", () => {
    test("undefined returns NaN", () => expect(timeToSeconds(undefined)).toBeNaN());
    test("null returns NaN", () => expect(timeToSeconds(null)).toBeNaN());
    test("empty string returns NaN", () => expect(timeToSeconds("")).toBeNaN());
  });

  describe("HH:mm string", () => {
    test("00:00 → 0", () => expect(timeToSeconds("00:00")).toBe(hhmm(0, 0)));
    test("09:00 → 32400", () => expect(timeToSeconds("09:00")).toBe(hhmm(9, 0)));
    test("10:30 → 37800", () => expect(timeToSeconds("10:30")).toBe(hhmm(10, 30)));
    test("17:45 → 63900", () => expect(timeToSeconds("17:45")).toBe(hhmm(17, 45)));
    test("23:59 → 86340", () => expect(timeToSeconds("23:59")).toBe(hhmm(23, 59)));
  });

  describe("HH:mm:ss string (seconds are ignored)", () => {
    test("10:30:00 → same as 10:30", () => expect(timeToSeconds("10:30:00")).toBe(hhmm(10, 30)));
    test("10:30:45 → same as 10:30", () => expect(timeToSeconds("10:30:45")).toBe(hhmm(10, 30)));
    test("00:00:00 → 0", () => expect(timeToSeconds("00:00:00")).toBe(0));
  });

  describe("12-hour AM/PM strings", () => {
    test("12:00 AM → midnight (0)", () => expect(timeToSeconds("12:00 AM")).toBe(hhmm(0, 0)));
    test("01:00 AM → 3600", () => expect(timeToSeconds("01:00 AM")).toBe(hhmm(1, 0)));
    test("09:30 AM → 34200", () => expect(timeToSeconds("09:30 AM")).toBe(hhmm(9, 30)));
    test("12:00 PM → noon (43200)", () => expect(timeToSeconds("12:00 PM")).toBe(hhmm(12, 0)));
    test("01:00 PM → 13:00 (46800)", () => expect(timeToSeconds("01:00 PM")).toBe(hhmm(13, 0)));
    test("11:59 PM → 23:59 (86340)", () => expect(timeToSeconds("11:59 PM")).toBe(hhmm(23, 59)));
    test("lowercase am/pm accepted", () => expect(timeToSeconds("09:00 am")).toBe(hhmm(9, 0)));
  });

  describe("Date objects", () => {
    test("Date at 10:30 local → 37800", () => {
      const d = new Date();
      d.setHours(10, 30, 0, 0);
      expect(timeToSeconds(d)).toBe(hhmm(10, 30));
    });

    test("Date at midnight → 0", () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      expect(timeToSeconds(d)).toBe(0);
    });

    test("invalid Date → NaN", () => {
      expect(timeToSeconds(new Date("invalid"))).toBeNaN();
    });
  });

  describe("ISO datetime strings (fallback Date parse)", () => {
    test("1970-01-01T10:30:00 → 37800", () => {
      // This is the pattern used for time min/max in the time validator
      const secs = timeToSeconds("1970-01-01T10:30:00");
      expect(secs).toBe(hhmm(10, 30));
    });
  });

  describe("plain number inputs — interpreted as HHMM", () => {
    test("1030 → 10:30 (37800s)", () => expect(timeToSeconds(1030)).toBe(hhmm(10, 30)));
    test("930 → 09:30 (34200s)", () => expect(timeToSeconds(930)).toBe(hhmm(9, 30)));
    test("0 → 00:00 (0s)", () => expect(timeToSeconds(0)).toBe(0));
    test("100 → 01:00 (3600s)", () => expect(timeToSeconds(100)).toBe(hhmm(1, 0)));
    test("2359 → 23:59 (86340s)", () => expect(timeToSeconds(2359)).toBe(hhmm(23, 59)));
    test("2400 → NaN (hour 24 invalid)", () => expect(timeToSeconds(2400)).toBeNaN());
    test("1060 → NaN (minute 60 invalid)", () => expect(timeToSeconds(1060)).toBeNaN());
  });

  describe("invalid / garbage strings → NaN", () => {
    test("arbitrary word", () => expect(timeToSeconds("not-a-time")).toBeNaN());
    test("bare digit string '1030' → 10:30 (HHMM)", () => expect(timeToSeconds("1030")).toBe(hhmm(10, 30)));
    test("bare digit string '930' → 09:30 (HHMM)", () => expect(timeToSeconds("930")).toBe(hhmm(9, 30)));
    test("bare digit string '2400' → NaN (invalid)", () => expect(timeToSeconds("2400")).toBeNaN());
    test("boolean true → NaN", () => expect(timeToSeconds(true)).toBeNaN());
    test("object → NaN", () => expect(timeToSeconds({})).toBeNaN());
  });
});
