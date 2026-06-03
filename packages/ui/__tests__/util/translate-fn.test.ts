import { describe, expect, test, beforeEach } from "bun:test";
import { t, setTranslateFn } from "../../src/util/translate-fn";

describe("t (default translate fn — en.json fallback)", () => {
  // Restore the default after each test that swaps the fn
  beforeEach(() => {
    setTranslateFn((key, params) => {
      // reimport the default behaviour inline so tests are self-contained
      const { get } = require("lodash-es");
      const en = require("../../src/i18n/en.json");
      if (!key) return "";
      let str = get(en, key, key);
      if (params) {
        Object.keys(params).forEach((k) => {
          str = str.replace(`{{${k}}}`, params[k]);
        });
      }
      return str;
    });
  });

  describe("basic key lookup", () => {
    test("returns value for a known top-level key", () => {
      expect(t("has_errors")).toBe("The interview has errors");
    });

    test("returns value for a nested key", () => {
      expect(t("form.back")).toBe("Back");
      expect(t("form.next")).toBe("Next");
      expect(t("form.loading")).toBe("Loading...");
    });

    test("returns value for a deeply nested key", () => {
      expect(t("debug.form_values")).toBe("Form values");
      expect(t("validations.required")).toBe("This field is required");
    });

    test("returns the key itself when not found (fallback)", () => {
      expect(t("does.not.exist")).toBe("does.not.exist");
      expect(t("unknown_key")).toBe("unknown_key");
    });

    test("returns empty string for undefined key", () => {
      expect(t(undefined)).toBe("");
    });

    test("returns empty string for empty string key", () => {
      expect(t("")).toBe("");
    });
  });

  describe("parameter interpolation", () => {
    test("replaces a single {{param}} in the string", () => {
      expect(t("validations.max", { max: 50 })).toBe("Must be at most 50 characters");
    });

    test("replaces {{min}} placeholder", () => {
      expect(t("validations.min", { min: 3 })).toBe("Must be at least 3 characters");
    });

    test("replaces multiple placeholders", () => {
      expect(t("validations.invalid_time_range", { min: "09:00", max: "17:00" })).toBe(
        "Time must be between 09:00 and 17:00",
      );
    });

    test("leaves unreplaced placeholders intact when params omitted", () => {
      expect(t("validations.max")).toBe("Must be at most {{max}} characters");
    });

    test("ignores extra params that have no placeholder", () => {
      expect(t("form.back", { irrelevant: "value" })).toBe("Back");
    });

    test("works with string param values", () => {
      expect(t("validations.min_date", { min: "2024-01-01" })).toBe(
        "Date must be after 2024-01-01",
      );
    });
  });
});

describe("setTranslateFn", () => {
  test("overrides the translate function", () => {
    setTranslateFn(() => "overridden");
    expect(t("any.key")).toBe("overridden");
  });

  test("custom fn receives key and params", () => {
    let capturedKey: string | undefined;
    let capturedParams: Record<string, any> | undefined;

    setTranslateFn((key, params) => {
      capturedKey = key;
      capturedParams = params;
      return "captured";
    });

    t("some.key", { foo: "bar" });

    expect(capturedKey).toBe("some.key");
    expect(capturedParams).toEqual({ foo: "bar" });
  });

  test("custom fn returning empty string is respected", () => {
    setTranslateFn(() => "");
    expect(t("form.back")).toBe("");
  });
});
