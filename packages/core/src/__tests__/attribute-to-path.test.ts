import { describe, expect, it } from "bun:test";
import type { Session } from "../types";
import { attributeToPath, decodeFieldPath } from "../util";

const data = (parent?: string) => ({ "@parent": parent }) as unknown as Session["data"];

// attributeToPath turns a rule-graph attribute into the string react-hook-form
// registers as a field name. Now that attributes can be canonical text
// (`the employee's name`) rather than a GUID, the returned name must be RHF-safe
// or RHF silently drops characters from it (see field-name-codec.test.ts).

describe("attributeToPath — canonical-text attributes", () => {
  it("leaves a plain attribute with no RHF-hostile characters unchanged", () => {
    expect(attributeToPath("the employee name", data(), {}, false)).toBe("the employee name");
  });

  it("encodes an apostrophe in a simple attribute (the reported bug)", () => {
    expect(attributeToPath("the employee's name", data(), {}, false)).toBe("the employee%27s name");
  });

  it("encodes quotes and brackets too", () => {
    expect(attributeToPath('the "primary" [rôle]', data(), {}, false)).toBe("the %22primary%22 %5Brôle%5D");
  });

  it("strips the @parent prefix then encodes the remainder", () => {
    const path = attributeToPath(
      "employees/employee-1/the person's age",
      data("employees/employee-1"),
      {},
      false,
    );
    expect(path).toBe("the person%27s age");
  });

  it("encodes each segment of a flat entity path but keeps the / separators", () => {
    const path = attributeToPath("the household/id-1/the person's age", data(), {}, false);
    expect(path).toBe("the household/id-1/the person%27s age");
  });

  it("is idempotent on an already-encoded nested path (re-fed by EntityFormControl)", () => {
    const encoded = "the household.0.the person%27s age";
    expect(attributeToPath(encoded, data(), {}, true)).toBe(encoded);
  });

  it("returns nullish/empty attributes untouched", () => {
    expect(attributeToPath(undefined, data(), {}, false)).toBeUndefined();
    expect(attributeToPath("", data(), {}, false)).toBe("");
  });

  it("round-trips back to the original attribute via decodeFieldPath", () => {
    const cases: Array<[string, string | undefined]> = [
      ["the employee's name", undefined],
      ["the household/id-1/the person's \"nickname\"", undefined],
      ["employees/employee-1/the person's age", "employees/employee-1"],
    ];
    for (const [attribute, parent] of cases) {
      const field = attributeToPath(attribute, data(parent), {}, false) as string;
      const expected = parent ? attribute.replace(`${parent}/`, "") : attribute;
      expect(decodeFieldPath(field)).toBe(expected);
    }
  });
});
