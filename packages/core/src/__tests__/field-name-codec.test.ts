import { describe, expect, it } from "bun:test";
import {
  decodeFieldPath,
  decodeFieldSegment,
  decodeFormData,
  encodeFieldPath,
  encodeFieldSegment,
} from "../util";

// react-hook-form's stringToPath does `name.replace(/["|']|\]/g, "").split(/\.|\[/)`,
// so these five characters are the only ones that corrupt a field name: `.` and `[`
// become path separators, `"` `'` `]` are deleted outright. `normaliseText` (the
// canonical-text producer) can emit all five, plus `%`, so the codec must escape
// exactly those six and leave everything else untouched for readability.
const RHF_HOSTILE = ["'", '"', ".", "[", "]"];

describe("encodeFieldSegment / decodeFieldSegment", () => {
  it("escapes the five RHF-hostile characters as upper-case percent codes", () => {
    expect(encodeFieldSegment("'")).toBe("%27");
    expect(encodeFieldSegment('"')).toBe("%22");
    expect(encodeFieldSegment(".")).toBe("%2E");
    expect(encodeFieldSegment("[")).toBe("%5B");
    expect(encodeFieldSegment("]")).toBe("%5D");
  });

  it("self-escapes the percent sign so literal %XX text cannot be mistaken for an escape", () => {
    // Without this, `discount %22 code` would decode to `discount " code`.
    expect(encodeFieldSegment("%")).toBe("%25");
    expect(encodeFieldSegment("discount %22 code")).toBe("discount %2522 code");
    expect(decodeFieldSegment("discount %2522 code")).toBe("discount %22 code");
  });

  it("leaves readable characters alone", () => {
    // spaces, hyphen, backslash (normaliseText maps `|` -> `\`), parens, unicode
    const readable = "the employee-manager's \\ (primary) rôle";
    // only the apostrophe is hostile here
    expect(encodeFieldSegment(readable)).toBe("the employee-manager%27s \\ (primary) rôle");
  });

  it("produces output containing none of the RHF-hostile characters", () => {
    const samples = [
      "the employee's name",
      'a "quoted" value',
      "array[0] access",
      "trailing bracket]",
      "dotted.attribute.name",
      "%2E already looks encoded",
      "Beyonce's naive protege's fiance",
    ];
    for (const s of samples) {
      const encoded = encodeFieldSegment(s);
      for (const c of RHF_HOSTILE) {
        expect(encoded.includes(c)).toBe(false);
      }
    }
  });

  it("round-trips every sample losslessly", () => {
    const samples = [
      "",
      "plain",
      "the employee's name",
      'the "final" answer',
      "the company inc. revenue",
      "schedule[monday] hours",
      "weird]name",
      "100%",
      "50% off",
      "%22",
      "%2E",
      "%ZZ", // percent + non-hex: not a valid escape, must survive verbatim
      "%",
      "trailing%",
      "  leading and trailing spaces  ",
      "dash-dash and \\ pipe-slash",
      "rôle café — naïve", // post-normalise this keeps the em dash / accents; codec must not care
      "'.[]\"%", // every hostile char plus escape, back to back
    ];
    for (const s of samples) {
      expect(decodeFieldSegment(encodeFieldSegment(s))).toBe(s);
    }
  });

  it("accepts lower-case hex on decode (hand-edited names)", () => {
    expect(decodeFieldSegment("the employee%27s name")).toBe("the employee's name");
    expect(decodeFieldSegment("a%2eb")).toBe("a.b");
  });

  it("guards the segment names react-hook-form's set() refuses to write", () => {
    // RHF silently no-ops when a whole segment === one of these, so the encoded
    // form must differ from the literal string while still round-tripping.
    for (const reserved of ["__proto__", "constructor", "prototype"]) {
      const encoded = encodeFieldSegment(reserved);
      expect(encoded).not.toBe(reserved);
      expect(decodeFieldSegment(encoded)).toBe(reserved);
    }
  });
});

describe("encodeFieldPath / decodeFieldPath", () => {
  it("encodes each segment but preserves the / entity-path separator", () => {
    expect(encodeFieldPath("household/id-1/the person's age")).toBe("household/id-1/the person%27s age");
  });

  it("preserves the . nesting separator and numeric indices", () => {
    expect(encodeFieldPath("the household.0.the person's age")).toBe("the household.0.the person%27s age");
  });

  it("round-trips mixed separators", () => {
    const paths = [
      "the employee's name",
      "household/9f2c/the person's \"nickname\"",
      "the household.0.members.1.the person's age",
      "plain/path/no/specials",
    ];
    for (const p of paths) {
      expect(decodeFieldPath(encodeFieldPath(p))).toBe(p);
    }
  });
});

describe("decodeFormData", () => {
  it("decodes flat top-level keys", () => {
    expect(decodeFormData({ "the employee%27s name": "Bob" })).toEqual({ "the employee's name": "Bob" });
  });

  it("decodes each segment of a flat /-joined entity path key", () => {
    expect(decodeFormData({ "household/id-1/the person%27s age": 42 })).toEqual({
      "household/id-1/the person's age": 42,
    });
  });

  it("recurses nested objects and arrays produced by repeating containers", () => {
    const rhf = {
      "the household": [
        { "@id": "a", "the person%27s age": 1, "the company inc%2E revenue": 10 },
        { "@id": "b", "the person%27s age": 2, "the company inc%2E revenue": 20 },
      ],
    };
    expect(decodeFormData(rhf)).toEqual({
      "the household": [
        { "@id": "a", "the person's age": 1, "the company inc. revenue": 10 },
        { "@id": "b", "the person's age": 2, "the company inc. revenue": 20 },
      ],
    });
  });

  it("never rewrites values, only keys", () => {
    // a value that happens to look encoded must be left exactly as-is
    expect(decodeFormData({ note: "literally %27 in the value" })).toEqual({
      note: "literally %27 in the value",
    });
  });

  it("passes @id / @parent and nullish entries through untouched", () => {
    expect(
      decodeFormData({ "@parent": "employees/employee-1", "@id": "x", a: null, b: undefined }),
    ).toEqual({ "@parent": "employees/employee-1", "@id": "x", a: null, b: undefined });
  });
});
