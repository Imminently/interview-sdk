# Advanced Usage

## Subscribing to SessionManager state with useSyncExternalStore

When you manage the `SessionManager` yourself (Pattern B — using `<Interview.Root manager={manager}>`), you may need to read session state outside the `useInterview()` hook — for example in a parent component that wraps the interview, or in a custom provider.

The correct React primitive for this is `useSyncExternalStore`. The `SessionManager` is designed as an external store: it has `subscribe` and `getSnapshot` methods that map directly to what `useSyncExternalStore` expects.

```tsx
import { useSyncExternalStore } from 'react';
import { SessionManager } from '@imminently/interview-sdk';
import type { SessionSnapshot } from '@imminently/interview-sdk';

function useSessionSnapshot(manager: SessionManager): SessionSnapshot {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),   // subscribe(onStoreChange) => unsubscribe
    manager.getSnapshot.bind(manager), // getSnapshot() => SessionSnapshot
  );
}
```

Usage:

```tsx
function MyParentComponent() {
  const manager = useMemo(() => new SessionManager(options), []);
  const snapshot = useSessionSnapshot(manager);

  return (
    <div>
      {snapshot.state === 'success' && (
        <p>Step: {snapshot.session?.screen.title}</p>
      )}

      <Interview.Root manager={manager}>
        <Interview.Content />
      </Interview.Root>
    </div>
  );
}
```

### Why useSyncExternalStore and not useState + useEffect

`useSyncExternalStore` is the correct React API for external stores. It:

- Prevents tearing (React rendering different parts of the tree with inconsistent snapshots)
- Works correctly with concurrent rendering
- Handles subscription cleanup automatically

Using `useState` + `useEffect` + `manager.subscribe()` instead is error-prone and can produce stale state during concurrent renders.

### Why not useInterview()

`useInterview()` is only available inside the `<Interview>` or `<Interview.Root>` subtree. If you need snapshot data in a component that *wraps* the interview (a parent, a sibling, a portal), you need to call `useSyncExternalStore` directly as shown above.

### Accessing specific fields

You can derive more specific values from the snapshot to avoid unnecessary re-renders:

```tsx
function useInterviewStatus(manager: SessionManager) {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    () => manager.getSnapshot().state,
  );
}

function useIsComplete(manager: SessionManager) {
  return useSyncExternalStore(
    manager.subscribe.bind(manager),
    () => manager.isComplete,
  );
}
```

Note: React will re-render whenever `getSnapshot` returns a different value (by reference or value equality). Since `getSnapshot()` returns the full snapshot object (a new reference each time), the `useSessionSnapshot` hook above will re-render on every state change. For performance-sensitive cases, derive a primitive or stable value instead.

### Server-side rendering

If you need an `getServerSnapshot` argument (SSR), pass `manager.getSnapshot.bind(manager)` as the third argument too, or return a stable loading snapshot:

```tsx
useSyncExternalStore(
  manager.subscribe.bind(manager),
  manager.getSnapshot.bind(manager),
  () => ({ state: 'loading', session: null, loading: true, renderAt: 0 } as SessionSnapshot),
);
```
