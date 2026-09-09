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

It will **not** contain `/`. The SDK reserves `/` as its entity-path separator (`entity/instanceId/attribute`), and the platform does not allow it inside an attribute name.

## Why the SDK encodes them

Controls register their value with React Hook Form under a field name derived from the attribute (`useAttributeToFieldName`, then `attributeToPath`). RHF does not treat a field name as an opaque key. It parses it into a path with an internal `stringToPath`:

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

So `the employee's name` is stored (and later submitted to the API) as `the employees name`. `hours [monday]` becomes a nested `hours` then `monday` object. The corruption is silent: the control renders and edits fine, but the network payload on **Next** carries the wrong key and the rule engine cannot resolve the attribute.

`/` is safe (RHF does not split on it), which is why the SDK's own `entity/id/attribute` paths already survive. Only the five characters above are a problem, and only inside a single path segment.

## How the SDK encodes and decodes

A reversible percent-encoding codec lives in `@imminently/interview-sdk` (`packages/core/src/util.ts`):

| Function | Purpose |
|---|---|
| `encodeFieldSegment(s)` / `decodeFieldSegment(s)` | one path segment (an entity name or attribute name) |
| `encodeFieldPath(p)` / `decodeFieldPath(p)` | a whole field name, per segment, preserving the `/` and `.` separators the SDK puts between segments |
| `decodeFormData(values)` | recursively decode every **key** in a React Hook Form values object back to canonical text; values are never touched |

The scheme: percent-escape exactly `% " ' . [ ]`, and leave everything else alone so the encoded name stays readable in devtools and network payloads.

```
the employee's name          ->  the employee%27s name
hours [monday]               ->  hours %5Bmonday%5D
a "quoted" value             ->  a %22quoted%22 value
```

Two rules make it lossless:

1. **`%` is in the escape set** (`%` becomes `%25`). Without this, a canonical name that genuinely contains `%22` (valid text, since normalisation does not touch `%`) would decode back to `"`. Because every literal `%` is escaped first, any `%XX` in an encoded name is one the codec produced.
2. **Whole-segment guard** for `__proto__`, `constructor`, `prototype`. RHF's internal `set()` silently refuses to write those keys, so the codec escapes the first character (`constructor` becomes `%63onstructor`).

`decodeFieldSegment` is a single left-to-right pass (`/%([0-9A-Fa-f]{2})/g`), so it is unambiguous and accepts hand-typed lower-case hex.

## Where each side happens

**Encoding is done in one place only:** `attributeToPath` (the "attribute to RHF field name" function, used solely by `useAttributeToFieldName`). It returns an already-encoded, RHF-safe name. Repeating-entity controls additionally encode the leaf segment at path-construction time (`EntityFormControl`'s `FieldControl`), because once segments are joined into a `.`-path every `.` is assumed structural.

`pathToNested` deliberately stays **raw**. `dynamic/constructInput.ts` uses it to build the rules-engine input object, which must be keyed by real attribute names. `attributeToPath` feeds it decoded values and re-encodes the result.

**Decoding is done at every boundary where form data crosses back into the `SessionManager`:**

| Boundary | Call |
|---|---|
| Submitting a screen | `InterviewProvider` `onSubmit`, then `manager.next(decodeFormData(data))` |
| Saving a draft | `Interview.Save`, then `manager.save(decodeFormData(values))` |
| On-screen data change (dynamic solve, unknowns) | `useFormSync`, then `manager.onScreenDataChange(decodeFormData(value))` |

The invariant: **encoded field names never leave the form.** Anything sent to the API, or handed to the rule engine, uses the original canonical attribute text.

## Known limitation

A literal `.` in a **flat** (non-entity) attribute name is still routed through `pathToNested` as legacy dot-notation (`entity.instance.attribute`) and mangled before the codec sees it. Distinguishing "a dot in the name" from "a dot separating path segments" needs rule-graph knowledge that `attributeToPath` does not have. Dots inside a repeating-entity leaf name are handled; a flat attribute literally named `the company inc. revenue` is not.

## If you build custom controls

Use `useAttributeToFieldName(attribute)` to get the field name to `register` or pass to `Controller`. It returns the encoded, RHF-safe form. Do not build field names from raw attribute strings yourself. If you read `getValues()` and hand the result to the `SessionManager` directly (bypassing `Interview.Next` or `Interview.Save`), wrap it in `decodeFormData` first.
