# dev-app

Local harness for exercising `@imminently/interview-sdk` / `@imminently/interview-ui`
against a real Decisively environment.

## Setup

Create `dev-app/.env` (gitignored) with:

```sh
# Base URL of the Decisively API, no trailing slash
VITE_DECI_API_HOST=https://api.dev.decisively.imminently.co

# Bearer token (raw JWT, no "Bearer " prefix)
VITE_DECI_API_TOKEN=

# Tenancy id (group id) the token should act against
VITE_DECI_API_TENANCY=
```

Vite only exposes `VITE_`-prefixed vars to the browser, so the names must be kept
verbatim. A working dev host / token / tenancy already live in the repo-root
`.env.test` (`TEST_API_HOST` / `TEST_API_TOKEN` / `TEST_API_TENANCY`) — copy those
values across to get going. Restart the dev server after changing `.env`.

If a value is missing the app shows an "env missing" screen listing the keys
instead of the picker.

## Run

```sh
bun run dev     # from dev-app/, or `turbo run dev` from the repo root
```

Then open http://localhost:3000.

## What it does

- **Browse tab** — searchable workspace -> project -> interview pickers. Workspace
  and project search hits the API (`/workspaces/`, `/models/`); interviews are read
  from the project's current test release (`/releases/?...&$fields=...,interviews`).
- **Manual tab** — paste a project (model) id + interview name directly.
- Launching writes `?model=<id>&interview=<name>` to the URL, so a reload stays in
  the running interview. An auth failure (401/403) clears those params and returns
  to the picker.

## `src/_legacy/`

Parked `UIBrowser` / `Playground` screens, kept for a future revival. They're
excluded from `tsc` and the Vite build. See `src/_legacy/AGENTS.md`.
