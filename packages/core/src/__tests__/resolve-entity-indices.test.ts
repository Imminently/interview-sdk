import { describe, expect, it } from "bun:test";
import { resolveEntityIndices } from "../util";

// `resolveEntityIndices` takes a "/"-delimited `entity/id/attr` path and rewrites
// each entity @id to its 0-based array index against `data`, returning the path as
// segments (see references/canonical-attributes.md). Callers join those segments
// into a field name, or hand them straight to lodash set/get.
//
// It splits on "/" ONLY: a "." is a literal character in a canonical attribute
// name, never a separator. The loop treats even-position segments (0,2,4...) as
// entity/attribute NAMES and odd-position segments (1,3,5...) as the id between
// them.

const uuidVals = {
  household: [{ "@id": "abc" }, { "@id": "def" }, { "@id": "ghi" }],
};
const deepVals = {
  household: [
    { "@id": "h1", pets: [{ "@id": "p1" }, { "@id": "p2" }] },
    { "@id": "h2", pets: [{ "@id": "p9" }] },
  ],
};

describe("resolveEntityIndices - @id resolution", () => {
  it("replaces a matched @id with its 0-based array index", () => {
    // uuidVals.household = [abc, def, ghi]; "def" is at index 1, "ghi" at 2.
    expect(resolveEntityIndices("household/def/age", uuidVals)).toEqual(["household", "1", "age"]);
    expect(resolveEntityIndices("household/ghi/age", uuidVals)).toEqual(["household", "2", "age"]);
  });

  it("resolves @ids at every entity level of a deep path", () => {
    // household: h2 -> index 1; household[1].pets: p9 -> index 0.
    expect(resolveEntityIndices("household/h2/pets/p9/name", deepVals)).toEqual([
      "household",
      "1",
      "pets",
      "0",
      "name",
    ]);
  });

  it("returns a single non-entity attribute as one segment (no id position)", () => {
    expect(resolveEntityIndices("age", {})).toEqual(["age"]);
    expect(resolveEntityIndices("", {})).toEqual([""]);
  });

  it("stops on an even (name) segment, so an id-position leaf has no trailing name", () => {
    // parts = ["household", "h1"]; "h1" -> index 0 (deepVals has @id h1), and there
    // is no trailing name segment, so the result is just ["household", "0"].
    expect(resolveEntityIndices("household/h1", deepVals)).toEqual(["household", "0"]);
  });
});

describe("resolveEntityIndices - unresolved / numeric ids", () => {
  it("emits 'NaN' for an @id that is not found in the data", () => {
    // findIndex returns -1, so it falls back to parseInt("zzz") - 1 = NaN. This is
    // why a stale / unresolved @id produces a broken path.
    expect(resolveEntityIndices("household/zzz/age", uuidVals)).toEqual(["household", "NaN", "age"]);
  });

  it("treats a numeric id segment as 1-based and decrements it, with no entity data", () => {
    // No matching `household` array -> the id branch is just parseInt(part) - 1.
    expect(resolveEntityIndices("household/3/age", {})).toEqual(["household", "2", "age"]);
  });

  it("yields 'NaN' for a slash path whose id position is a word, not a number", () => {
    // "age" in an id position, no matching entity array -> parseInt("age") - 1 = NaN.
    expect(resolveEntityIndices("household/age", {})).toEqual(["household", "NaN"]);
  });
});

describe("resolveEntityIndices - a '.' is a literal character, only '/' is a separator", () => {
  it("keeps a literal '.' inside the leaf of a slash path", () => {
    // "/" splits into ["household", "h1", "the company inc. revenue"]; "h1" -> 0,
    // and the leaf name keeps its "." intact.
    expect(resolveEntityIndices("household/h1/the company inc. revenue", deepVals)).toEqual([
      "household",
      "0",
      "the company inc. revenue",
    ]);
  });

  it("returns a dotted string as one opaque segment (it is not a path)", () => {
    // No "/" -> a single even/name segment -> returned as-is, never parsed on ".".
    expect(resolveEntityIndices("household.2.age", uuidVals)).toEqual(["household.2.age"]);
    expect(resolveEntityIndices("household.2.pets.1.name", deepVals)).toEqual(["household.2.pets.1.name"]);
  });
});
