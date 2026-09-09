import { describe, expect, it } from "bun:test";
import { pathToNested } from "../util";

// Characterisation tests: these lock in how `pathToNested` behaves TODAY, quirks
// included. It converts an attribute path between the two representations the SDK
// uses (see references/canonical-attributes.md):
//   - slash-delimited `entity/id/attr`  (the flat / backend form,  nested=false)
//   - dot-delimited   `entity.idx.attr` (the react-hook-form nesting form, nested=true)
// and, given the current form `values`, resolves entity @id <-> array index.
//
// The loop treats even-position segments (0,2,4...) as entity/attribute NAMES and
// odd-position segments (1,3,5...) as the id/index sitting between them.

const uuidVals = {
  household: [{ "@id": "abc" }, { "@id": "def" }, { "@id": "ghi" }],
};
const numVals = {
  household: [{ "@id": "10" }, { "@id": "20" }, { "@id": "30" }],
};
const deepVals = {
  household: [
    { "@id": "h1", pets: [{ "@id": "p1" }, { "@id": "p2" }] },
    { "@id": "h2", pets: [{ "@id": "p9" }] },
  ],
};

describe("pathToNested — output separator", () => {
  it("joins with '/' when nested=false and with '.' when nested=true", () => {
    // Same resolution, only the separator differs: nested=true is the form RHF
    // splits into a real nested object; nested=false is the flat backend key.
    expect(pathToNested("household/def/age", uuidVals, false)).toBe("household/1/age");
    expect(pathToNested("household/def/age", uuidVals, true)).toBe("household.1.age");
  });

  it("returns a single non-entity attribute untouched (no id position to resolve)", () => {
    expect(pathToNested("age", {}, false)).toBe("age");
    expect(pathToNested("age", {}, true)).toBe("age");
    expect(pathToNested("", {}, false)).toBe("");
  });
});

describe("pathToNested — slash input (@id in the path), resolving against values", () => {
  it("replaces a matched @id with its 0-based array index", () => {
    // uuidVals.household = [abc, def, ghi]; "def" is at index 1.
    expect(pathToNested("household/def/age", uuidVals, true)).toBe("household.1.age");
    expect(pathToNested("household/ghi/age", uuidVals, true)).toBe("household.2.age");
  });

  it("resolves @ids at every entity level of a deep path", () => {
    // household: h2 -> index 1; household[1].pets: p9 -> index 0.
    expect(pathToNested("household/h2/pets/p9/name", deepVals, true)).toBe("household.1.pets.0.name");
    expect(pathToNested("household/h2/pets/p9/name", deepVals, false)).toBe("household/1/pets/0/name");
  });

  it("emits 'NaN' for an @id that is not found in values", () => {
    // findIndex returns -1, so it falls back to parseInt("zzz") - 1 = NaN.
    // This is why an unresolved / stale @id produces a broken path today.
    expect(pathToNested("household/zzz/age", uuidVals, true)).toBe("household.NaN.age");
  });

  it("treats a numeric id segment as 1-based and decrements it, even with no entity data", () => {
    // No `household` array in values -> the id branch just does parseInt(part) - 1.
    expect(pathToNested("household/3/age", {}, true)).toBe("household.2.age");
    expect(pathToNested("household/3/age", {}, false)).toBe("household/2/age");
  });

  it("stops on an even (name) segment, so an id-position leaf is dropped from a slash path", () => {
    // parts = ["household", "h1"]; "h1" resolves to index 0 (deepVals has @id h1)
    // and there is no trailing name segment, so the result is just "household.0".
    expect(pathToNested("household/h1", deepVals, true)).toBe("household.0");
  });
});

describe("pathToNested — dot input (wasNested), 1-based index in the path", () => {
  it("converts a 1-based dotted index to a 0-based index when nested=true", () => {
    // "household.2.age" -> the 2nd instance -> index 1.
    expect(pathToNested("household.2.age", uuidVals, true)).toBe("household.1.age");
    expect(pathToNested("household.2.age", numVals, true)).toBe("household.1.age");
  });

  it("when nested=false it emits (@id - 1), not the array index", () => {
    // wasNested + !nested path: it looks up entities[index]["@id"] and pushes
    // parseInt(@id) - 1. Numeric @ids -> "20" becomes "19"; uuid @ids -> "NaN".
    // This branch effectively assumes numeric @ids.
    expect(pathToNested("household.2.age", numVals, false)).toBe("household/19/age");
    expect(pathToNested("household.2.age", uuidVals, false)).toBe("household/NaN/age");
  });

  it("resolves 1-based indices at every level of a deep dotted path", () => {
    expect(pathToNested("household.2.pets.1.name", deepVals, true)).toBe("household.1.pets.0.name");
  });
});

describe("pathToNested — the literal-dot limitation", () => {
  it("mangles a flat attribute name that merely contains a '.'", () => {
    // "the company inc. revenue" has no entity structure, but the "." makes
    // wasNested true, so it splits into ["the company inc", " revenue"] and the
    // second part is treated as an id position -> parseInt(" revenue") - 1 = NaN.
    // Disambiguating this needs rule-graph knowledge pathToNested does not have.
    expect(pathToNested("the company inc. revenue", {}, false)).toBe("the company inc/NaN");
  });

  it("also mangles a plain slash path whose id position is a word, not a number", () => {
    // "household/age": "age" sits in an id position with no matching entity array,
    // so it becomes parseInt("age") - 1 = NaN. (attributeToPath avoids this by not
    // routing dot-free slash paths through pathToNested.)
    expect(pathToNested("household/age", {}, false)).toBe("household/NaN");
  });
});
