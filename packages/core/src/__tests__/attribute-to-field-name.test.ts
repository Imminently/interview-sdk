import { describe, expect, it } from "bun:test";
import type { Session } from "../types";
import { attributeToFieldName, decodeFieldPath } from "../util";

const data = (parent?: string) => ({ "@parent": parent }) as unknown as Session["data"];

// attributeToFieldName turns a rule-graph attribute into the string react-hook-form
// registers as a field name. Now that attributes can be canonical text
// (`the employee's name`) rather than a GUID, the returned name must be RHF-safe
// or RHF silently drops characters from it (see field-name-codec.test.ts).

describe("attributeToFieldName - canonical-text attributes", () => {
  it("leaves a plain attribute with no RHF-hostile characters unchanged", () => {
    expect(attributeToFieldName("the employee name", data(), {}, false)).toBe("the employee name");
  });

  it("encodes an apostrophe in a simple attribute (the reported bug)", () => {
    expect(attributeToFieldName("the employee's name", data(), {}, false)).toBe("the employee%27s name");
  });

  it("encodes quotes and brackets too", () => {
    expect(attributeToFieldName('the "primary" [rôle]', data(), {}, false)).toBe("the %22primary%22 %5Brôle%5D");
  });

  it("strips the @parent prefix then encodes the remainder", () => {
    const field = attributeToFieldName(
      "employees/employee-1/the person's age",
      data("employees/employee-1"),
      {},
      false,
    );
    expect(field).toBe("the person%27s age");
  });

  it("encodes each segment of a flat entity path but keeps the / separators", () => {
    const field = attributeToFieldName("the household/id-1/the person's age", data(), {}, false);
    expect(field).toBe("the household/id-1/the person%27s age");
  });

  it("is idempotent on an already-encoded nested path (re-fed by EntityFormControl)", () => {
    const encoded = "the household.0.the person%27s age";
    expect(attributeToFieldName(encoded, data(), {}, true)).toBe(encoded);
  });

  it("returns nullish/empty attributes untouched", () => {
    expect(attributeToFieldName(undefined, data(), {}, false)).toBeUndefined();
    expect(attributeToFieldName("", data(), {}, false)).toBe("");
  });

  it("round-trips back to the original attribute via decodeFieldPath", () => {
    const cases: Array<[string, string | undefined]> = [
      ["the employee's name", undefined],
      ['the household/id-1/the person\'s "nickname"', undefined],
      ["employees/employee-1/the person's age", "employees/employee-1"],
    ];
    for (const [attribute, parent] of cases) {
      const field = attributeToFieldName(attribute, data(parent), {}, false) as string;
      const expected = parent ? attribute.replace(`${parent}/`, "") : attribute;
      expect(decodeFieldPath(field)).toBe(expected);
    }
  });
});

// Characterisation: which branch an input takes, and the @parent handling.
describe("attributeToFieldName - routing and @parent handling (characterisation)", () => {
  const uuidVals = { household: [{ "@id": "abc" }, { "@id": "def" }, { "@id": "ghi" }] };

  it("nested + a '.' in the attribute is returned verbatim (no re-resolution)", () => {
    // The re-feed guard: EntityFormControl already resolved + joined this path, so
    // a second pass must not touch it. `values` is ignored entirely.
    expect(attributeToFieldName("household.99.age", data(), uuidVals, true)).toBe("household.99.age");
  });

  it("!nested: encodes per '/'-segment and does not resolve @ids", () => {
    // The flat form's only structural separator is '/'. An @id in it is left in
    // place (the backend resolves it); every segment is just encoded (here a no-op).
    expect(attributeToFieldName("household/def/age", data(), uuidVals, false)).toBe("household/def/age");
  });

  it("!nested: a '.' is a literal character in a canonical name, so it gets encoded", () => {
    // "/" is the only structural separator, so "." is data: each "." -> %2E.
    expect(attributeToFieldName("household.2.age", data(), {}, false)).toBe("household%2E2%2Eage");
    expect(attributeToFieldName("the company inc. revenue", data(), {}, false)).toBe("the company inc%2E revenue");
  });

  it("nested + no '.' resolves @id -> index and joins with '.'", () => {
    // slash input, nested=true -> resolve "def" to index 1, join the segments with '.'.
    expect(attributeToFieldName("household/def/age", data(), uuidVals, true)).toBe("household.1.age");
  });

  it("@parent is stripped only on an exact `${parent}/` prefix match", () => {
    expect(attributeToFieldName("employees/e1/the age", data("employees/e1"), {}, false)).toBe("the age");
    // "employees/e11/..." does not start with "employees/e1/", so nothing is stripped
    expect(attributeToFieldName("employees/e11/the age", data("employees/e1"), {}, false)).toBe(
      "employees/e11/the age",
    );
  });

  it("round-trips a canonical name containing a '.' back through decodeFieldPath", () => {
    const field = attributeToFieldName("the company inc. revenue", data(), {}, false) as string;
    expect(field).toBe("the company inc%2E revenue");
    expect(decodeFieldPath(field)).toBe("the company inc. revenue");
  });
});
