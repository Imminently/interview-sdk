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
