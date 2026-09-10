import { describe, expect, it } from "bun:test";
import { pathToNested } from "../util";

// Characterisation tests: these lock in how `pathToNested` behaves, quirks
// included. It takes a "/"-delimited `entity/id/attr` path and rewrites each entity
// @id to its 0-based array index against the current form `values`, joining the
// result with "/" (nested=false, the flat backend key) or "." (nested=true, the
// form react-hook-form splits into a real nested object). See
// references/canonical-attributes.md.
//
// It splits on "/" ONLY: a "." is a literal character in a canonical attribute
// name, never a separator. The loop treats even-position segments (0,2,4...) as
// entity/attribute NAMES and odd-position segments (1,3,5...) as the id between
// them.

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

describe("pathToNested: a '.' is a literal character, only '/' is a separator", () => {
  // Post-ENG-1101 pathToNested splits on "/" only. A dotted string is not a path
  // it recognises, so it comes back as one opaque segment rather than being parsed
  // into instances. Every live caller passes a genuine "/"-delimited path.
  it("returns a dotted string unchanged (one segment, not a path)", () => {
    expect(pathToNested("household.2.age", uuidVals, true)).toBe("household.2.age");
    expect(pathToNested("household.2.age", numVals, false)).toBe("household.2.age");
    expect(pathToNested("household.2.pets.1.name", deepVals, true)).toBe("household.2.pets.1.name");
  });

  it("keeps a literal '.' inside the leaf of a slash path", () => {
    // "/" splits into ["household", "h1", "the company inc. revenue"]; "h1" resolves
    // to index 0, and the leaf name keeps its "." intact.
    expect(pathToNested("household/h1/the company inc. revenue", deepVals, true)).toBe(
      "household.0.the company inc. revenue",
    );
  });

  it("still yields NaN for a slash path whose id position is a word, not a number", () => {
    // "household/age": "age" sits in an id position with no matching entity array,
    // so parseInt("age", 10) - 1 = NaN. Unchanged by the ENG-1101 fix.
    expect(pathToNested("household/age", {}, false)).toBe("household/NaN");
  });
});
