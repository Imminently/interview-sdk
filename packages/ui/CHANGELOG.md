# @imminently/interview-ui

## 5.1.0

### Minor Changes

- Added a "Graph" download button to the debug panel's Sequence tab, alongside the Sequence and Playwright exports.
- The debug tooltip on form controls now flags attributes missing from the client graph. The client graph is pruned to the active goal, so this usually means the attribute isn't wired into that goal.

### Patch Changes

- The debug panel (form control and typography tooltips, and the Form tab) now resolves canonical attribute names and descriptions correctly, instead of reverse-parsing the encoded field name. The Form tab also resolves nested entity instance data at every depth.
- Nested entity fields are resolved by instance `@id` rather than array index, and new entity instances use the core `generateEntityInstanceId` helper for their ids.
- The debug tooltip only shows the shift+click hint, and only intercepts shift+click, when an `onDebugControlClick` callback is registered.
- Updated dependencies
  - @imminently/interview-sdk@5.1.0

## 5.0.0

### Major Changes

- Added support for canonical ids: attributes identified by their canonical text name now round-trip through the form. Form values are decoded back to canonical attribute names before reaching the manager (on submit, save and form sync), and nested repeating-entity field paths are encoded to match.

### Patch Changes

- Explanations are now looked up via `manager.getExplanation` instead of indexing `session.explanations` with the encoded field name, which missed for entity-pathed attributes and names containing special characters.
- Accessibility fixes across form controls:
  - Required state is now exposed to assistive tech on every control.
  - `aria-invalid` and `aria-describedby` are now applied to the real input for Number, Currency, Number of Instances and File controls, instead of a wrapper element.
  - Radio controls now render their validation message (errors were previously invisible), and no longer report `aria-required="false"` when required.
  - Boolean controls use the translated label for their `aria-label`.
  - `aria-describedby` only references a description that actually rendered.
  - `NumberInput` now accepts a `required` prop.
- The Number of Instances validator only requires a value when `control.required` is true, matching the other control types.
- Time controls now handle `minutes_increment` values sent as strings.
- Updated dependencies
  - @imminently/interview-sdk@5.0.0
