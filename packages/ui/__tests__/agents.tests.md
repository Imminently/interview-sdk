# Test Infrastructure — packages/ui

## Libraries

- **[bun test](https://bun.sh/docs/cli/test)** — built-in test runner (`bun test`), no jest config needed
- **bun-types** (`devDependency`) — TypeScript declarations for `bun:test` (`describe`, `test`, `expect`, `beforeEach`, etc.)
- **lodash-es** — used inside `translate-fn` tests to reimplement the default translate behaviour in `beforeEach`

## TypeScript config

`__tests__/tsconfig.json` extends the package tsconfig with two overrides:
- `"types": ["bun-types"]` — enables `bun:test` module types
- `"rootDir": ".."` — allows imports from both `__tests__/` and `src/`

## Repo-specific notes

**Import paths in validators** — validators must import directly from `../global` and `../numerical` rather than from the barrel `../index`. The barrel re-exports `use-form-sync`, which imports `InterviewContext`, causing a circular dependency crash at test time.

**Zod v4** — the package uses zod v4. The error option for primitive schemas changed from `invalid_type_error` to `error`.

**`fileValidator` TypeError** — when passed a non-file value with `required: true`, the validator throws a `TypeError` (not a zod parse failure) because it accesses `v.fileRefs.length` without a type guard.

**Control and container component circular deps** — components like `BooleanControl`, `SwitchContainer`, etc. import from `@/interview` (the barrel), which re-imports the containers/controls barrels, causing "Cannot access X before initialization" errors. Fixed by changing three files to import from `@/interview/InterviewContext` directly instead of the barrel: `src/providers/DebugSettingsContext.tsx`, `src/components/controls/Explanation.tsx`, `src/components/ui/form.tsx`. Container files (`DataContainer`, `SwitchContainer`, `InterviewContainer`) received the same fix.

**Container utility functions** — `mapControls` and `isSupportedControl` were extracted to `src/util/container-utils.ts` (no React imports) so they can be tested directly without triggering the `SwitchContainer → RenderControl → containers barrel → SwitchContainer` cycle.

**Testing React hooks** — `useInterviewLifecycle.ts` can be tested with `mock.module()` + `await import()`. Mock `react` to capture `useEffect` callbacks, mock `@/interview/InterviewContext` to supply a fake manager, then call the hook and run the captured effects manually.

**`Number("")` is `0`** — `toNum("")` returns `0`, not `undefined`. Tests for `parseCurrencyControl` and `parseNumberControl` must reflect this.
