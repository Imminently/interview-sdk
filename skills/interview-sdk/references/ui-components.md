# UI Components

All components are from `@imminently/interview-ui` and available under the `Interview.*` namespace.

```typescript
import { Interview } from '@imminently/interview-ui';
```

## Interview (main wrapper)

Creates and manages a `SessionManager` internally. Takes `ManagerOptions` via the `options` prop.

```tsx
<Interview options={options}>
  {/* compositional children, or omit for default layout */}
</Interview>
```

Props:

- `options: ManagerOptions` — **must be memoized** (see critical rules in SKILL.md)
- `slots?: Record<string, React.FC>` — custom control components
- `form?: { mode, reValidateMode, shouldFocusError }` — React Hook Form config
- `inlineErrors?: boolean` — show validation errors inline on each control
- `readOnly?: boolean` — disable all inputs
- `callbacks?: { onDebugControlClick }` — event callbacks
- `icons?: Record<string, React.ComponentType<{ className?: string }>>` — icon overrides
- `children?: React.ReactNode` — custom layout

## Interview.Root (InterviewProvider)

Use when you create the `SessionManager` yourself (advanced pattern).

```tsx
import { SessionManager } from '@imminently/interview-sdk';

const manager = new SessionManager(options);

<Interview.Root manager={manager}>
  {/* your UI */}
</Interview.Root>
```

Useful when you need access to the manager outside the Interview tree, or want to initialize a session before rendering.

## Interview.Content

Renders `null` when the session is not in the `success` state. When the session is `success`, it renders a fixed default layout: `InterviewTitle`, `Interview.Form`, `Interview.Validations`, `Interview.Back`, and `Interview.Next`.

```tsx
<Interview.Content />
```

It does not support custom children — use the individual compositional components directly (alongside `Interview.Loading` and `Interview.Error` for the other states) if you need a custom layout:

```tsx
<Interview.Error />
<Interview.Loading />
{/* Interview.Content equivalent, manually composed */}
<div className="...">
  <Interview.Form />
  <Interview.Validations />
  <Interview.Back />
  <Interview.Next />
</div>
```

## Interview.Form

Renders the controls for the current screen using React Hook Form. Form submission is handled by `InterviewProvider`, which renders the actual HTML `<form>` element — `Interview.Form` renders the fields inside it.

```tsx
<Interview.Form className="space-y-4" />
```

`Interview.Next` is `type="submit"` and triggers `InterviewProvider`'s form submit handler, which calls `manager.next(data)` with the current form values.

> **Important — button types inside the interview:** Because `InterviewProvider` renders an HTML `<form>`, any `<button>` without an explicit `type` attribute defaults to `type="submit"` and will unintentionally trigger form submission. Always set `type="button"` on any button that should not submit (e.g. "Save draft", "Cancel", custom actions). `Interview.Next` is already `type="submit"`; `Interview.Back` and `Interview.Reset` are already `type="button"`.

## Interview.Steps

Displays interview steps in the default shadcn sidebar layout, including a progress bar footer.

> **Requires `<SidebarProvider>` above it in the tree.** The default layout (`<Interview.Content />`) provides this automatically. If you are composing a custom layout and want to use `Interview.Steps`, you must wrap your layout in `<SidebarProvider>` from `@imminently/interview-ui`. If you are providing your own sidebar, use `InterviewStepList` instead.

```tsx
import { SidebarProvider } from '@imminently/interview-ui';

// Custom layout with Interview.Steps — must provide SidebarProvider
<SidebarProvider>
  <Interview.Steps />
  <SidebarInset>
    {/* your content */}
  </SidebarInset>
</SidebarProvider>
```

```tsx
// Show sub-steps
<Interview.Steps showSubSteps />           // all depths
<Interview.Steps showSubSteps={1} />       // one level of children
<Interview.Steps showSubSteps={2} />       // two levels deep

// Custom item rendering
<Interview.Steps
  renderStep={({ step, index, navigate, children }) => (
    <button onClick={navigate}>{index + 1}. {step.title}</button>
  )}
/>
```

### InterviewStepList

For embedding steps inside your own sidebar, drawer, or sheet — renders only the step list items, no sidebar chrome, and has no `SidebarProvider` dependency:

```tsx
import { InterviewStepList } from '@imminently/interview-ui';

<MySidebar>
  <InterviewStepList showSubSteps={2} />
</MySidebar>
```

Accepts the same `showSubSteps` and `renderStep` props as `Interview.Steps`, plus an optional `steps` override to render a custom subset.

## Interview.Next / Interview.Back / Interview.Reset

Navigation buttons.

```tsx
<Interview.Back className="..." />
<Interview.Reset className="..." />  // type="button", calls manager.reset()
<Interview.Next className="..." />   // type="submit", triggers InterviewProvider's form submit
```

`Interview.Next` does **not** call `manager.next()` directly — it submits the HTML form owned by `InterviewProvider`, whose submit handler calls `manager.next(data)`.

Use `asChild` to inject `onClick` and `disabled` into your own button:

```tsx
<Interview.Next asChild>
  <button className="btn-primary">Continue</button>
</Interview.Next>

<Interview.Back asChild>
  <button className="btn-secondary">Previous</button>
</Interview.Back>

<Interview.Reset asChild>
  <button className="btn-secondary">Start Over</button>
</Interview.Reset>
```

## Interview.Progress

Shows interview completion percentage.

```tsx
<Interview.Progress className="..." />
```

## Interview.Validations

Displays rule validation messages from the current session. Defaults to showing errors only — pass `severity` to change this. Always include this somewhere visible.

```tsx
<Interview.Validations />                    // errors only (default)
<Interview.Validations severity="warning" /> // warnings only
```

Pairs with `inlineErrors={false}` to centralise all errors in one place.

## Interview.Loading / Interview.Error / Interview.Processing

Fallback components for different states.

```tsx
<Interview.Loading />    // shown while session initialises
<Interview.Error />      // shown on API/session errors
<Interview.Processing /> // shown during async operations (submit, navigate)
```

These can be placed outside `Interview.Content` to handle top-level states, or they render automatically inside `Interview.Content`.

## Lifecycle hooks

Subscribe to core session events from within the React tree:

```tsx
import {
  useInterviewComplete,
  useInterviewSessionUpdate,
  useInterviewLifecycleEvent,
  useInterviewCreate,
  useInterviewLoad,
  useInterviewReset,
  useInterviewError,
  useInterviewSessionStart,
  useInterviewActiveSessionChange,
} from '@imminently/interview-ui';

function InterviewEffects() {
  useInterviewSessionUpdate(({ session, source }) => {
    console.log('updated from', source, session.screen.id);
  });

  useInterviewComplete(({ session }) => {
    analytics.track('interview_complete', { sessionId: session.sessionId });
  });

  useInterviewLifecycleEvent('error', ({ error, source }) => {
    console.error('manager error', source, error);
  });

  return null;
}
```

Place this component anywhere inside `<Interview>` or `<Interview.Root>`.

## Internationalisation

```tsx
import { setTranslateFn } from '@imminently/interview-ui';

// Call once at application entry point
setTranslateFn((key) => i18n.t(key));
```

## Z-index

Override the stacking context for dialogs, popovers, selects, tooltips:

```css
:root {
  --interview-ui-z-index: 2000;
}
```
