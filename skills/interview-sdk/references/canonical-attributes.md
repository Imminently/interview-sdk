# Canonical attributes

Rule-graph attributes can be referenced two ways:

- **By GUID**: a stable id like `9f2c8a1e-...`, historically how the interview data model keyed everything.
- **By canonical text**: the human-readable attribute name itself, e.g. `the employee's name`.

The platform is moving off GUIDs (the "Remove GUID dependencies" initiative). The interview SDK has to accept an attribute reference that is now an arbitrary human sentence rather than a `[0-9a-f-]` id, and round-trip it through a React form without corrupting it.

## How Decisively produces canonical text

Attribute names are run through a normaliser before they become a canonical reference (`normaliseText` in `@packages/commons`, and `normalizeText` in `decisively-core`'s graph utils, which builds the `namespace/description` node key). Normalisation:

- **Strips diacritics**: `naïve` becomes `naive`, `café` becomes `cafe` (NFD decompose, drop combining marks). Ligatures and stroke letters (`æ`, `ø`, `ß`) are left as-is.
- **Collapses whitespace**: every whitespace variant (tab, NBSP, en-space, and so on) becomes a single ASCII space; leading and trailing trimmed; runs collapsed.
- **Folds quotes**: every single-quote-like character (`'`, `‚`, `‹`, ...) becomes ASCII `'`; every double-quote-like (`"`, `«`, `„`, ...) becomes ASCII `"`.
- **Folds dashes**: every dash (en dash, em dash, ...) becomes ASCII `-`; runs collapsed.
- **Maps pipe**: `|` becomes `\` (commons only).

Everything else passes through untouched. So a canonical attribute name can legitimately contain unicode letters, digits, single spaces, and the literal characters `' " - \`, plus any pass-through punctuation such as `. , : ; ( ) [ ] { } < > = + * & # @ % $ ^ _ ~`.

`normalizeText` in `decisively-core` (the one that builds the `namespace/description` node key) is slightly narrower than commons' `normaliseText`: it does **not** apply the `|` -> `\` fold, so a reference derived from a node key can also contain a literal `|`.

It will **not** contain `/`. The SDK reserves `/` as its entity-path separator (`entity/instanceId/attribute`), and the platform does not allow it inside an attribute name.

## Why the SDK encodes them

Controls register their value with React Hook Form under a field name derived from the attribute (`useAttributeToFieldName`, then `attributeToFieldName`). RHF does not treat a field name as an opaque key. It parses it into a path with an internal `stringToPath`:

```js
name.replace(/["|']|\]/g, "").split(/\.|\[/)
```

For any name that is not purely `\w`, that means:

| Character | What RHF does to it |
|---|---|
| `.` | treated as a nesting separator |
| `[` | treated as a nesting separator |
| `]` | **deleted** |
| `'` | **deleted** |
| `"` | **deleted** |
| `\|` | **deleted** (the `["\|']` class in the regex covers pipe) |

So `the employee's name` is stored (and later submitted to the API) as `the employees name`. `hours [monday]` becomes a nested `hours` then `monday` object. The corruption is silent: the control renders and edits fine, but the network payload on **Next** carries the wrong key and the rule engine cannot resolve the attribute.

`/` is safe (RHF does not split on it), which is why the SDK's own `entity/id/attribute` paths already survive. `/` is also the **only** separator the backend uses in an attribute path, so a `.` in an attribute is always a literal character in a canonical name, never a path separator. Six characters are a problem (`. [ ] ' " |`), and only inside a single path segment.

## How the SDK encodes and decodes

A reversible percent-encoding codec lives in `@imminently/interview-sdk` (`packages/core/src/util.ts`):

| Function | Purpose |
|---|---|
| `encodeFieldSegment(s)` / `decodeFieldSegment(s)` | one path segment (an entity name or attribute name) |
| `encodeFieldPath(p)` / `decodeFieldPath(p)` | a whole field name, per segment, preserving the `/` and `.` separators between segments. `decodeFieldPath` is what `decodeFormData` runs on each key; `encodeFieldPath` is a standalone helper (the encode side now happens per segment inside `attributeToFieldName`). |
| `decodeFormData(values)` | recursively decode every **key** in a React Hook Form values object back to canonical text; values are never touched |

The scheme: percent-escape exactly `% " ' . [ ] |`, and leave everything else alone so the encoded name stays readable in devtools and network payloads.

```
the employee's name          ->  the employee%27s name
hours [monday]               ->  hours %5Bmonday%5D
a "quoted" value             ->  a %22quoted%22 value
revenue | net of tax         ->  revenue %7C net of tax
```

Two rules make it lossless:

1. **`%` is in the escape set** (`%` becomes `%25`). Without this, a canonical name that genuinely contains `%22` (valid text, since normalisation does not touch `%`) would decode back to `"`. Because every literal `%` is escaped first, any `%XX` in an encoded name is one the codec produced.
2. **Whole-segment guard** for `__proto__`, `constructor`, `prototype`. RHF's internal `set()` silently refuses to write those keys, so the codec escapes the first character (`constructor` becomes `%63onstructor`).

`decodeFieldSegment` is a single left-to-right pass (`/%([0-9A-Fa-f]{2})/g`), so it is unambiguous and accepts hand-typed lower-case hex.

`|` is in the escape set because RHF deletes it too, and `decisively-core`'s `normalizeText` (unlike commons' `normaliseText`, which folds `|` to `\`) leaves it in a node-key-derived reference.

## The functions

`packages/core/src/util.ts` splits the work into four pieces, each with one job:

| Function | Job |
|---|---|
| `expressRelativeToParent(attr, data)` | strip an exact `${data["@parent"]}/` prefix so the attribute reads relative to the instance the screen is scoped to |
| `resolveEntityIndices(path, data)` | rewrite each entity `@id` in a `/`-path to its 0-based array index against `data`; returns **segments** (`["household", "0", "attr"]`). Raw (no encoding). Splits on `/` only. |
| `baseAttributeId(attr)` | the last `/`-segment: the key `session.explanations` is stored under (matches the backend's `extractAttributeId`). Used by `SessionManager.getExplanation`; `Explanation.tsx` calls that method rather than indexing `session.explanations` itself. |
| `attributeToFieldName(attr, data, values, nested)` | produce the RHF field name; the only one `useAttributeToFieldName` calls |

**`attributeToFieldName` is where encoding happens**, and the only caller is `useAttributeToFieldName`:

- **Flat form** (the default): `expressRelativeToParent`, then encode each `/`-segment and rejoin. `@id`s stay in place (the backend resolves them). A `.` is encoded like any other hostile character.
- **Nested form** (inside a repeating entity, `nested = true`): `expressRelativeToParent`, then `resolveEntityIndices` for `@id` -> index, then `encodeFieldSegment` each segment and join with `.` so `useFieldArray` can bind to it. `EntityFormControl`'s `FieldControl` pre-encodes the leaf and re-feeds an already-joined `entity.index.leaf` path, which the idempotency guard passes straight through.

`resolveEntityIndices` is also called directly by `dynamic/constructInput.ts` to build the client rules-engine input: it hands the segments straight to lodash `set`/`get` against the positional `entityStructure`. No encoding there (the rules engine is keyed by real attribute names).

**Decoding is done at every boundary where form data crosses back into the `SessionManager`:**

| Boundary | Call |
|---|---|
| Submitting a screen | `InterviewProvider` `onSubmit`, then `manager.next(decodeFormData(data))` |
| Saving a draft | `Interview.Save`, then `manager.save(decodeFormData(values))` |
| On-screen data change (dynamic solve, unknowns) | `useFormSync`, then `manager.onScreenDataChange(decodeFormData(value))` |

The invariant: **encoded field names never leave the form.** Anything sent to the API, or handed to the rule engine, uses the original canonical attribute text.

## Assumption

The whole scheme treats a `.` as a literal character in an attribute name, never a path separator. `attributeToFieldName`'s flat branch encodes it, and `resolveEntityIndices` splits on `/` only. This relies on the backend never emitting legacy dot-notation paths (`entity.instance.attribute`) for interview controls. Every attribute path the platform produces is `/`-delimited (node ids are `parent_path/entity/index/refId`, `@parent` is `entity/instanceId`, and the canonical key is `namespace/description`), so this holds today. If dot-notation paths were reintroduced, both places would need a way to tell them apart from a name that simply contains a `.`.

Historically the id-resolution function (`pathToNested`) also parsed a dot-delimited input (`entity.index.attr`) back into `/` form and could swap the output separator. Its only producer was the old flat form of the field-name function; it was renamed to `resolveEntityIndices`, made segment-returning, and that branch removed, so a dotted canonical name is now passed through as a single opaque segment rather than being misparsed.

## If you build custom controls

Use `useAttributeToFieldName(attribute)` to get the field name to `register` or pass to `Controller`. It returns the encoded, RHF-safe form. Do not build field names from raw attribute strings yourself. If you read `getValues()` and hand the result to the `SessionManager` directly (bypassing `Interview.Next` or `Interview.Save`), wrap it in `decodeFormData` first.
