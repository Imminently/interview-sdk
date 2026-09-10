import { describe, expect, it } from "bun:test";
import { constructInputFromPreProcessed } from "../dynamic/constructInput";
import preProcessedState1 from "./preProcessedState1.json";
import preProcessedState1Result from "./preProcessedState1_result.json";

// constructInputFromPreProcessed rebuilds the client rules-engine input from the
// backend preProcessedState (entityStructure + nodes) plus the current userValues
// (the decoded on-screen form data). Every nodes key, and every userValues key
// containing "/", is run through resolveEntityIndices, which turns an
// `entity/@id/attr` path into positional segments (`["entity", "0", "attr"]`) for
// lodash `set`. A "." in an attribute name is data, never a separator; "/" never
// appears in a canonical name. See references/canonical-attributes.md.

const noParent = { "@parent": undefined };

describe("constructInputFromPreProcessed", () => {
  it("1. should construct input from empty preprocessed state", () => {
    const userValues = { name: "John", age: 30 };

    const result = constructInputFromPreProcessed(preProcessedState1, noParent, userValues);

    // To regenerate: write JSON.stringify(result, null, 2) to preProcessedState1_result.json.
    expect(result).toEqual(preProcessedState1Result);
  });

  it("2. should merge slash-keyed userValues into the correct nested entity array items", () => {
    // Reproduces a bug where userValues like "industries/1/guid": true were being
    // assigned as flat top-level keys instead of being resolved into the industries array.
    const GUID = "be8ccd4d-917d-4fbc-9eaf-c0e9b2e3498a";

    const existingData = {
      industries: [
        { "@id": "1", [GUID]: false, name: "Children's services" },
        { "@id": "2", [GUID]: false, name: "School education" },
      ],
    };

    const data = { "@parent": undefined };

    const userValues = {
      [`industries/1/${GUID}`]: true,
      [`industries/2/${GUID}`]: false,
    };

    const result = constructInputFromPreProcessed(null, data, userValues, existingData);

    // The updated boolean should be merged into the correct array item
    expect(result.industries[0][GUID]).toBe(true);
    expect(result.industries[1][GUID]).toBe(false);

    // Slash-keyed paths must NOT appear as top-level properties
    expect(result[`industries/1/${GUID}`]).toBeUndefined();
    expect(result[`industries/2/${GUID}`]).toBeUndefined();
  });
});

describe("constructInputFromPreProcessed - entity path resolution", () => {
  it("applies a node previousValue at the resolved nested path", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1" }, { "@id": "h2" }] },
      nodes: { "household/h2/the age": { previousValue: 40 } },
    };
    const out = constructInputFromPreProcessed(pre, noParent, {});
    // "h2" is the 2nd household instance -> array index 1; leaf stays "the age".
    expect(out.household[1]["the age"]).toBe(40);
  });

  it("writes a flat (non-entity) userValue at the top level", () => {
    const out = constructInputFromPreProcessed({ entityStructure: {}, nodes: {} }, noParent, {
      "the persons age": 22,
    });
    // No "/" in the key -> it bypasses resolveEntityIndices entirely.
    expect(out["the persons age"]).toBe(22);
  });

  it("routes a '/'-delimited userValue into the resolved nested slot", () => {
    const pre = { entityStructure: { household: [{ "@id": "h1" }, { "@id": "h2" }] }, nodes: {} };
    const out = constructInputFromPreProcessed(pre, noParent, { "household/h2/the age": 41 });
    // Same "h2" -> index 1 resolution as the nodes path uses.
    expect(out.household[1]["the age"]).toBe(41);
  });

  it("resolves non-numeric (slug) entity ids by exact @id match", () => {
    const pre = {
      entityStructure: {
        industries: [{ "@id": "childrens-services" }, { "@id": "school-education" }],
      },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(pre, noParent, {
      "industries/school-education/the funding": 1000,
    });
    // "school-education" is not numeric and not found by parseInt; it is matched by
    // @id === "school-education" -> index 1.
    expect(out.industries[1]["the funding"]).toBe(1000);
  });

  it("resolves date-like entity ids by exact @id match, not by parseInt", () => {
    const pre = {
      entityStructure: {
        timesheet_workdays: [{ "@id": "2025-07-01" }, { "@id": "2025-07-02" }],
      },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(pre, noParent, {
      "timesheet_workdays/2025-07-02/hours": 8,
    });
    // parseInt("2025-07-02") would be 2025; the @id string match wins first -> index 1.
    expect(out.timesheet_workdays[1].hours).toBe(8);
  });

  it("resolves @ids at every level of a deep path", () => {
    const pre = {
      entityStructure: { employees: [{ "@id": "e1", roles: [{ "@id": "r1" }, { "@id": "r2" }] }] },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(pre, noParent, {
      "employees/e1/roles/r2/the title": "Lead",
    });
    // employees: e1 -> 0; employees[0].roles: r2 -> 1.
    expect(out.employees[0].roles[1]["the title"]).toBe("Lead");
  });

  it("merges userValues into the @parent instance, keeping its existing keys", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1", "the name": "Ada" }] },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(pre, { "@parent": "household/1" }, { "the age": 30 });
    // parent "household/1": "1" is not an @id here, so it falls back to (1 - 1) = 0.
    // userValues is spread over the existing instance, so "@id" and "the name" survive.
    expect(out.household[0]).toEqual({ "@id": "h1", "the name": "Ada", "the age": 30 });
  });

  it("falls back to a NaN index for an unresolved entity id (stale @id)", () => {
    const out = constructInputFromPreProcessed({ entityStructure: {}, nodes: {} }, noParent, {
      "household/ghost/x": 1,
    });
    // Nothing named "household" to resolve against and "ghost" is not numeric, so
    // the id position becomes NaN. This is a pre-existing stale-@id behaviour, not
    // something the canonical-name handling introduced.
    expect(out.household.NaN.x).toBe(1);
  });

  it("does not mutate preProcessedState or existingData", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1" }] },
      nodes: { "household/h1/the age": { previousValue: 5 } },
    };
    const existing = { household: [{ "@id": "h1" }] };
    const preSnap = structuredClone(pre);
    const existingSnap = structuredClone(existing);
    constructInputFromPreProcessed(pre, noParent, { foo: 1 }, existing);
    // produce() works on a draft; the inputs are left untouched.
    expect(pre).toEqual(preSnap);
    expect(existing).toEqual(existingSnap);
  });
});

describe("constructInputFromPreProcessed - canonical-text attribute names", () => {
  // Attributes can now be canonical text rather than a GUID. normaliseText lets a
  // name contain ' " [ ] . and %; only "/" is reserved. These names arrive here
  // already decoded (decodeFormData at the form boundary), so the raw characters
  // are back by the time constructInputFromPreProcessed sees them.

  it("keeps flat (non-entity) attributes with ' \" [ ] and . verbatim at the top level", () => {
    const out = constructInputFromPreProcessed({ entityStructure: {}, nodes: {} }, noParent, {
      "the employee's name": "Ada",
      'the "primary" role': "Engineer",
      "hours [monday]": "8",
      "the company inc. revenue": 1000000,
    });
    // No "/" in any key -> straight assignment, no path parsing.
    expect(out).toMatchObject({
      "the employee's name": "Ada",
      'the "primary" role': "Engineer",
      "hours [monday]": "8",
      "the company inc. revenue": 1000000,
    });
  });

  it("keeps ' \" [ ] in the leaf of a '/'-pathed userValue", () => {
    const pre = { entityStructure: { employees: [{ "@id": "e1" }] }, nodes: {} };
    const out = constructInputFromPreProcessed(pre, noParent, {
      "employees/e1/the employee's name": "Ada",
      'employees/e1/the "primary" role': "Engineer",
      "employees/e1/hours [monday]": "8",
    });
    // "/" splits the path; the leaf name keeps every hostile character.
    expect(out.employees[0]).toEqual({
      "@id": "e1",
      "the employee's name": "Ada",
      'the "primary" role': "Engineer",
      "hours [monday]": "8",
    });
  });

  it("keeps a '.' in the leaf of a '/'-pathed userValue (previously threw)", () => {
    const pre = { entityStructure: { household: [{ "@id": "h1" }] }, nodes: {} };
    const out = constructInputFromPreProcessed(pre, noParent, { "household/h1/Ph.D. status": true });
    // resolveEntityIndices splits on "/" only: ["household", "h1", "Ph.D. status"].
    // Before the slash-only change this threw a TypeError on every dynamic solve.
    expect(out.household[0]["Ph.D. status"]).toBe(true);
    expect(out.household[0]["@id"]).toBe("h1");
  });

  it("applies a '.'-containing node key at the resolved nested path", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1" }] },
      nodes: { "household/h1/inc. revenue": { previousValue: 99 } },
    };
    const out = constructInputFromPreProcessed(pre, noParent, {});
    expect(out.household[0]["inc. revenue"]).toBe(99);
  });

  it("applies a global (no-'/') node key containing a '.' at the top level", () => {
    const pre = {
      entityStructure: {},
      nodes: { "the company inc. revenue": { previousValue: 500 } },
    };
    const out = constructInputFromPreProcessed(pre, noParent, {});
    // One segment (no "/"), so previousValue lands at draft["the company inc. revenue"].
    expect(out["the company inc. revenue"]).toBe(500);
  });

  it("handles hostile characters and dots together in a deep path", () => {
    const pre = {
      entityStructure: { employees: [{ "@id": "e1", roles: [{ "@id": "r1" }] }] },
      nodes: {},
    };
    const key = 'employees/e1/roles/r1/the "lead\'s" Ph.D. flag';
    const out = constructInputFromPreProcessed(pre, noParent, { [key]: true });
    // Only the three "/" split the path; the leaf (quotes, apostrophe, two dots) is
    // one segment and reaches lodash intact.
    expect(out.employees[0].roles[0]['the "lead\'s" Ph.D. flag']).toBe(true);
  });

  it("spreads canonical-text userValues keys into the @parent instance unchanged", () => {
    const pre = {
      entityStructure: { employees: [{ "@id": "e1", "the name": "Ada" }] },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(
      pre,
      { "@parent": "employees/e1" },
      { "the employee's name": "Ada Lovelace", "Ph.D. status": true },
    );
    // @parent branch spreads userValues as-is (no per-key path parsing), so the
    // apostrophe and dots come through untouched.
    expect(out.employees[0]).toEqual({
      "@id": "e1",
      "the name": "Ada",
      "the employee's name": "Ada Lovelace",
      "Ph.D. status": true,
    });
  });
});
