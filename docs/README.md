## Interview SDK Documentation

Local development:

```bash
bun install
bun run dev # from docs directory or: bun run dev:docs at repo root
```

Build:
```bash
bun run build:docs
```

Tech stack: Next.js 14 + fumadocs-ui + Tailwind CSS + react-live playground.

Workspace links leverage monorepo packages; rebuild core/ui with turbo dev for live refresh.
