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

Handles loading/error/success states automatically. Always wrap your form content in this.

```tsx
<Interview.Content>
  <Interview.Form />
  <Interview.Validations />
</Interview.Content>
```

In the `loading` state it renders `<Interview.Loading>`, in `error` it renders `<Interview.Error>`, in `success` it renders children.

## Interview.Form

Renders all controls for the current screen using React Hook Form. **Owns form submission** — when submitted, calls `manager.next(data)` with current form values.

```tsx
<Interview.Form className="space-y-4" />
```

`Interview.Next` renders a `type="submit"` button and works with this component — clicking Next or pressing Enter inside the form submits it.

## Interview.Steps

Displays the interview step navigation sidebar, including a progress bar footer.

```tsx
<Interview.Steps />

// Show sub-steps
<Interview.Steps showSubSteps />           // all depths
<Interview.Steps showSubSteps={1} />       // one level of children
<Interview.Steps showSubSteps={2} />       // two levels deep

// Custom item rendering
<Interview.Steps
  renderStep={({ step, index, depth, navigate, children }) => (
    <button onClick={navigate}>{index + 1}. {step.title}</button>
  )}
/>
```

### InterviewStepList

For embedding steps inside a custom sidebar or drawer — renders only the menu items, no sidebar chrome:

```tsx
import { InterviewStepList } from '@imminently/interview-ui';

<Sidebar>
  <SidebarContent>
    <InterviewStepList showSubSteps={2} />
  </SidebarContent>
</Sidebar>
```

Accepts the same `showSubSteps` and `renderStep` props as `Interview.Steps`, plus an optional `steps` override to render a custom subset.

## Interview.Next / Interview.Back / Interview.Reset

Navigation buttons.

```tsx
<Interview.Back className="..." />
<Interview.Reset className="..." />  // calls manager.reset()
<Interview.Next className="..." />   // type="submit", works with Interview.Form
```

`Interview.Next` does **not** call `manager.next()` directly — it submits the surrounding `Interview.Form`.

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

Displays validation errors and warnings from the current session. Always include this somewhere visible.

```tsx
<Interview.Validations className="mb-6" />
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
