import { describe, expect, it } from "bun:test";
import { constructInputFromPreProcessed } from "../dynamic/constructInput";

// `constructInputFromPreProcessed` rebuilds the rules-engine input object from the
// backend `preProcessedState` plus the current `userValues` (the decoded on-screen
// form data). It routes anything that looks like an entity path - every
// `preProcessedState.nodes` key, and every `userValues` key containing "/" -
// through `pathToNested(key, draft, false)`, then splits the result on "/" for
// lodash `set`. See references/canonical-attributes.md.
//
// "/" can never appear in a canonical attribute name, so a leaf that contains a
// literal "." (a dotted canonical name) survives this round trip intact (ENG-1101).

const noParent = { "@parent": undefined };

describe("constructInputFromPreProcessed - characterisation", () => {
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
    expect(out["the persons age"]).toBe(22);
  });

  it("routes a '/'-delimited userValue through pathToNested into a nested slot", () => {
    const pre = { entityStructure: { household: [{ "@id": "h1" }, { "@id": "h2" }] }, nodes: {} };
    const out = constructInputFromPreProcessed(pre, noParent, { "household/h2/the age": 41 });
    // Same "h2" -> index 1 resolution as the nodes path above.
    expect(out.household[1]["the age"]).toBe(41);
  });

  it("merges userValues into the @parent instance, keeping its existing keys", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1", "the name": "Ada" }] },
      nodes: {},
    };
    const out = constructInputFromPreProcessed(pre, { "@parent": "household/1" }, { "the age": 30 });
    // parent "household/1" -> numeric id 1, decremented to index 0; "@id" and
    // "the name" survive because userValues is spread over the existing instance.
    expect(out.household[0]).toEqual({ "@id": "h1", "the name": "Ada", "the age": 30 });
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
    // produce() works on a draft; the inputs are untouched.
    expect(pre).toEqual(preSnap);
    expect(existing).toEqual(existingSnap);
  });
});

describe("constructInputFromPreProcessed - canonical-text attribute names (ENG-1101)", () => {
  it("keeps a flat non-entity attribute whose name contains a '.'", () => {
    // No "/" in the key, so it bypasses pathToNested entirely and lands verbatim.
    const out = constructInputFromPreProcessed({ entityStructure: {}, nodes: {} }, noParent, {
      "the company inc. revenue": 1_000_000,
    });
    expect(out["the company inc. revenue"]).toBe(1_000_000);
  });

  it("resolves a '/'-pathed userValue whose leaf contains a '.'", () => {
    // pathToNested now splits on "/" only: ["household", "h1", "Ph.D. status"].
    // "h1" -> index 0; the dotted leaf name is preserved as a single lodash key.
    const pre = { entityStructure: { household: [{ "@id": "h1" }] }, nodes: {} };
    const out = constructInputFromPreProcessed(pre, noParent, { "household/h1/Ph.D. status": true });
    expect(out.household[0]["Ph.D. status"]).toBe(true);
    expect(out.household[0]["@id"]).toBe("h1");
  });

  it("applies a canonical node key that contains a '.' at the right nested path", () => {
    const pre = {
      entityStructure: { household: [{ "@id": "h1" }] },
      nodes: { "household/h1/inc. revenue": { previousValue: 99 } },
    };
    const out = constructInputFromPreProcessed(pre, noParent, {});
    expect(out.household[0]["inc. revenue"]).toBe(99);
  });

  it("applies a global (no-'/') node key that contains a '.' at the top level", () => {
    // The nodes loop calls pathToNested on every key; "the company inc. revenue" has
    // no "/", so it is one segment and the previousValue lands at draft[<that key>].
    const pre = {
      entityStructure: {},
      nodes: { "the company inc. revenue": { previousValue: 500 } },
    };
    const out = constructInputFromPreProcessed(pre, noParent, {});
    expect(out["the company inc. revenue"]).toBe(500);
  });

  it("an unresolved @id still yields a NaN index, but the dotted leaf survives", () => {
    // Nothing named "household" in the draft -> the "h1" @id cannot be resolved, so
    // the id position becomes NaN (a pre-existing stale-@id behaviour). The "." in
    // the leaf is NOT what breaks it: the leaf name is still one intact segment.
    const out = constructInputFromPreProcessed({ entityStructure: {}, nodes: {} }, noParent, {
      "household/h1/Ph.D. status": true,
    });
    expect(out.household.NaN["Ph.D. status"]).toBe(true);
  });
});
