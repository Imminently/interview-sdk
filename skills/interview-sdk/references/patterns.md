# Patterns, Security & Debugging

## Security: backend proxy

**Never call Decisively APIs directly from client-side code in production.**

Decisively API credentials are high-privilege (power-user equivalent). Exposing them client-side allows users to extract tokens, call unintended endpoints, and access internal rules and metadata.

**Always use a backend proxy:**

```
Client UI → Your Backend Proxy → Decisively API
```

Your proxy:
- Holds Decisively credentials server-side only
- Limits which endpoints are reachable
- Strips sensitive response fields (graphs, rules, internal metadata)
- Enforces your own auth, rate limiting, and auditing

Point the SDK at your proxy:

```typescript
apiManager: {
  host: 'https://api.yourcompany.com',  // your proxy, not api.decisively.io
  auth: async () => ({
    headers: { Authorization: `Bearer ${yourUserToken}` }
  })
}
```

See [examples.md](./examples.md#6-backend-proxy-express) for a full Express proxy example.

## Preventing re-initialization

**Always memoize the `options` object** passed to `<Interview>`. A new object reference on every render causes the Interview component to tear down and recreate the `SessionManager` on every render — infinite API calls, flickers, lost state.

```tsx
// ✅ correct
const options = useMemo(() => ({
  apiManager: { host: '...', auth: () => ({ headers: { ... } }) },
  init: async (manager) => { await manager.create({ project: 'my-project' }); }
}), [token]); // only recreate when token changes

// ❌ wrong — new object every render
const options = {
  apiManager: { host: '...', auth: () => ({ headers: { ... } }) }
};
```

Same applies when creating a `SessionManager` outside React:

```tsx
// ✅ correct
const manager = useMemo(() => new SessionManager(options), []);

// ✅ also correct — create once outside the component
const manager = new SessionManager(options);
function App() { return <Interview.Root manager={manager}>...</Interview.Root>; }
```

## State management in React

Do **not** call `manager.subscribe()` manually in React components. Use `useInterview()` — it uses `useSyncExternalStore` and handles subscriptions correctly.

```tsx
// ✅ correct
function MyComponent() {
  const { session, state, nextDisabled } = useInterview();
  // ...
}

// ❌ wrong in React
manager.subscribe(() => {
  const snapshot = manager.getSnapshot();
  // causes issues with React's render cycle
});
```

Manual subscription is fine outside React (Node.js, tests, non-React frameworks).

## Conditional rendering based on session state

```tsx
function CustomLayout() {
  const { session, state } = useInterview();

  if (state !== 'success') return null;

  const isFirstScreen = !session.progress?.canGoBack;
  const isComplete = session.complete;

  return (
    <div>
      {isComplete && <CompletionMessage />}
      {!isComplete && (
        <>
          <h1>{session.screen.title}</h1>
          {/* form content */}
        </>
      )}
    </div>
  );
}
```

## Custom error handling

```tsx
import { useInterview } from '@imminently/interview-ui';

function CustomError() {
  const { error } = useInterview();

  const status = (error as any)?.status;
  if (status === 401 || status === 403) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error?.message}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
}

// Usage — place alongside Interview.Content
<Interview options={options}>
  <CustomError />
  <Interview.Loading />
  <Interview.Content />
</Interview>
```

## Custom navigation with validation check

```tsx
function CustomNextButton() {
  const { manager, nextDisabled, validation } = useInterview();

  const handleNext = async () => {
    if (validation.error) {
      alert('Please fix errors before continuing');
      return;
    }
    await manager.next({});
  };

  return (
    <button disabled={nextDisabled} onClick={handleNext}>
      Continue
    </button>
  );
}
```

Note: if using `Interview.Form`, prefer `Interview.Next` (which submits the form) rather than calling `manager.next()` directly, so React Hook Form validation runs first.

## Session persistence

```typescript
const options: ManagerOptions = {
  // ...
  sessionStore: {
    get: () => JSON.parse(localStorage.getItem('session') || '{}'),
    set: (value) => localStorage.setItem('session', JSON.stringify(value))
  }
};
```

Note: `sessionStore` is marked "coming soon" in the core README — confirm it's available in the version you're using.

## Styling

### With Tailwind CSS (recommended)

```css
/* app.css */
@import "tailwindcss";
@source "../node_modules/@imminently/interview-ui";
```

The `@source` directive makes Tailwind scan the package so all utility classes used internally are generated.

### Without Tailwind

```tsx
import '@imminently/interview-ui/dist/index.css';
```

### Component-level overrides

All `Interview.*` components accept `className`:

```tsx
<Interview.Form className="space-y-6 max-w-2xl" />
<Interview.Back className="btn btn-secondary" />
<Interview.Next className="btn btn-primary" />
<Interview.Validations className="mb-4 text-sm" />
```

## Debugging

Enable debug mode in `ManagerOptions`:

```tsx
const options = useMemo(() => ({
  debug: true,  // mounts debug infrastructure
  // ...
}), []);
```

Once mounted, press `Ctrl+D` (or `Cmd+D`) to toggle the floating debug panel, which shows tabs for session data, form state, and validations. Press `` ` `` to toggle advanced container overlays. Shift-click any control to inspect its metadata.

Toggle programmatically:

```typescript
manager.setDebugEnabled(true);
manager.setAdvancedDebugEnabled(true);
```

## Common issues

**Interview keeps reinitializing / infinite API calls**
- Cause: `options` object not memoized
- Fix: wrap in `useMemo`

**"Cannot read property of undefined" / hook errors**
- Cause: `useInterview()` called outside `<Interview>` or `<Interview.Root>` context
- Fix: ensure the component is a descendant of `Interview` or `Interview.Root`

**Custom control not showing**
- Cause: wrong key in `slots` — must match the control's `type` field exactly
- Fix: check `session.screen.controls[n].type` vs your slot key

**Form validation not triggering on custom control**
- Cause: input not wrapped in `<FormControl>`
- Fix: wrap your `<input>` in `<FormControl>` so React Hook Form can track it

**`Interview.Next` not submitting**
- Cause: `Interview.Next` renders `type="submit"` and relies on a surrounding `Interview.Form` — it doesn't call `manager.next()` itself
- Fix: ensure `<Interview.Next>` is inside the same render tree as `<Interview.Form>`

## Best practices

1. **Memoize options** — prevents re-initialization on every render
2. **Use `Interview.Content`** — handles loading/error states automatically
3. **Use external `SessionManager` for complex apps** — gives you lifecycle access outside the React tree
4. **Prefer slots for targeted control changes** — don't rebuild the whole form to tweak one input
5. **Use `asChild` for button styling** — keeps SDK functionality while allowing custom markup
6. **Always include `Interview.Validations`** — don't rely solely on inline errors
7. **Respect `nextDisabled` / `backDisabled`** — reflects SDK navigation state, not just form validity
8. **Enable `debug: true` during development** — the debug panel catches state issues early
9. **Use lifecycle hooks for side effects** — `useInterviewComplete`, `useInterviewSessionUpdate`, etc. are cleaner than subscribing to the manager manually
