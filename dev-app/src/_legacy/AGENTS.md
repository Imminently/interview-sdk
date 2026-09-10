# `_legacy/` — parked dev-app screens

These files are **parked, not dead**. They are kept for a future revival of the
component-browser side of the dev-app and should not be deleted.

## What's here

| File | What it was | Why it's parked |
| --- | --- | --- |
| `UIBrowser.tsx` | A component gallery: pick a control/component from a list, edit its props as JSON, see it render live with a theme picker. | Superseded for now by the single interview screen. |
| `Playground.tsx` | Paste (or generate from a step definition) an interview-response payload and render the interview UI against it, with a values/errors/fields viewer. | Same. |
| `InterviewValuesViewer.tsx` | Read-only JSON viewer for `values` / `errors` / `fields` from `useInterview()`. Used only by `Playground.tsx`. | Moves with Playground. |
| `interview.util.ts` | `convertDefinitionToResponse(...)` — turns a step definition into a mock interview response. Used only by `Playground.tsx`. | Moves with Playground. |
| `interviews/simple.json` | Sample interview definition consumed by `Playground.tsx`. | Moves with Playground. |

## Why they don't currently compile

They import from `@imminently/interview-ui` names that no longer exist
(`InterviewProvider`, `InterviewForm`, `InterviewSteps`, `InterviewTitle`,
`InterviewActions`, `InterviewAlert`, `InterviewSidebar`, `ThemeProvider`,
`BooleanControl`, `TextControl`, `CurrencyControl`, `DateControl`, ...) plus the
removed `@imminently/interview-sdk-theme-default` package. The live screen has since
moved to the `Interview.*` compound-component API (see `src/interview/`).

They are excluded from the build so they don't break it:

- `dev-app/tsconfig.json` -> `"exclude": ["src/_legacy"]`
- `dev-app/vite.config.ts` -> `_legacy` in `server.watch.ignored` and `build.rollupOptions.external`

## Reviving

1. Move the file(s) back under `src/` (or a new `src/gallery/`).
2. Port imports to the current `@imminently/interview-ui` surface (`Interview.*`,
   `useInterview`, `SidebarProvider`/`SidebarInset`, the current control exports).
3. Replace `@imminently/interview-sdk-theme-default` with whatever theming the UI
   package exposes now.
4. Re-add a way to reach the screen (the old `src/main.tsx` had a `currentPage`
   switch; a small nav or a `?screen=` param is enough).
5. Drop the `_legacy` exclude entries once nothing here is left.
