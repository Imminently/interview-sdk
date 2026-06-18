---
name: interview-sdk
description: Guide for implementing and customizing @imminently/interview-sdk and @imminently/interview-ui — the Decisively interview/questionnaire SDK for React applications.
---

# Interview SDK

Use this skill when working with `@imminently/interview-sdk` or `@imminently/interview-ui`, or when building any UI that integrates with the Decisively API to run interviews/questionnaires.

## When to use

- Setting up a new interview integration
- Configuring `SessionManager` or `ManagerOptions`
- Using or customising `Interview.*` React components
- Building custom controls or layouts
- Handling session lifecycle, navigation, or file uploads
- Debugging interview state or re-render issues

## Packages

Both packages are usually needed together:

```bash
npm install @imminently/interview-sdk @imminently/interview-ui
```

- **`@imminently/interview-sdk`** — core business logic: `SessionManager`, API/file communication, TypeScript types
- **`@imminently/interview-ui`** — React components built on top of the SDK (`Interview`, `useInterview`, controls, etc.)

## Architecture

```
<Interview> (main wrapper — creates SessionManager internally)
  └── <Interview.Root> (InterviewProvider — context + useSyncExternalStore)
      ├── <Interview.Error>
      ├── <Interview.Loading>
      ├── <Interview.Processing>
      └── <Interview.Content>
          ├── <Interview.Steps>
          ├── <Interview.Form>       ← owns form submission
          ├── <Interview.Validations>
          ├── <Interview.Back>
          ├── <Interview.Next>       ← submit button, works with Interview.Form
          ├── <Interview.Reset>
          └── <Interview.Progress>
```

Two usage patterns:
- **Simple** — pass `options` to `<Interview>`, it manages the `SessionManager`
- **Advanced** — create `SessionManager` yourself, pass to `<Interview.Root manager={manager}>`

## Critical rules

1. **Always memoize `options`** — a new object every render causes infinite re-initialization
2. **Never manually subscribe** in React — use `useInterview()` hook instead
3. **Use a backend proxy** in production — never expose Decisively credentials client-side

## References

- [Session Manager](./references/session-manager.md) — `SessionManager` API: create, load, navigate, state, lifecycle events, file operations
- [UI Components](./references/ui-components.md) — all `Interview.*` components, props, and lifecycle hooks
- [Customization](./references/customization.md) — slots, custom controls, `useInterview` hook, full custom UI
- [Configuration](./references/configuration.md) — `ManagerOptions`, `ApiManager`, `FileManager`, `InterviewConfig` full type reference
- [Examples](./references/examples.md) — complete working code examples
- [Patterns](./references/patterns.md) — common patterns, proxy/security setup, styling, debugging, best practices
