# Validation

There are two distinct validation systems that can independently block navigation and surface errors to the user.

## Form validation

Client-side validation that runs locally before the form is submitted. It checks the current control values against constraints defined per control type — required fields, type formats, value ranges, etc. This is powered by Zod resolvers in the UI package.

- Fires on blur, change, or submit depending on your `form.mode` config
- Surfaces through `FormMessage` on individual controls
- Blocks form submission — if form validation fails, `manager.next()` is never called
- Reflects in `nextDisabled` from `useInterview()`

No extra setup is needed — the built-in controls handle this automatically. If you build custom controls, use `FormMessage` which reads the error from React Hook Form context and renders it automatically.

## Rule validation

Server-side validation produced by the Decisively rule engine. After the user submits a screen, the rule base evaluates the entered data and may return one or more validation messages attached to the session.

These are returned as `session.validations`, an array of:

```typescript
interface Validation {
  id: string;
  message: string;
  parent?: string;           // attribute or control the validation relates to
  severity: 'error' | 'warning';
  attributes: string[];      // attribute IDs involved
  shown?: boolean;           // only shown === true validations should be surfaced
}
```

Rule validations are surfaced in two ways:

### 1. Interview.Validations

Renders visible rule validation messages for the current screen. Only renders validations where `shown === true`. Defaults to showing errors only — pass `severity` to change this.

```tsx
<Interview.Validations />                    // errors only (default)
<Interview.Validations severity="error" />   // errors only (explicit)
<Interview.Validations severity="warning" /> // warnings only
```

Errors render with a red alert style, warnings with yellow. Returns null if there are no matching visible validations.

### 2. validation on context

The `useInterview()` hook exposes a `validation` object that summarises whether any shown validations exist:

```tsx
const { validation } = useInterview();

validation.error;   // true if any shown validation has severity === 'error'
validation.warning; // true if any shown validation has severity === 'warning'
```

A rule validation error also contributes to `nextDisabled` — the user cannot advance while errors are present.

## How they interact

| | Form validation | Rule validation |
|---|---|---|
| **When** | Before submission (client-side) | After submission (server response) |
| **Scope** | Individual control values | Rule base logic across all data |
| **Shown on** | `FormMessage` per control | `Interview.Validations` (centralised) |
| **Blocks next** | Yes — form won't submit | Yes — via `nextDisabled` |
| **Cleared by** | Fixing the control value | Re-submitting with valid data |

Both must pass for the user to advance to the next screen. It is common for form validation to pass (all fields filled, correct format) but rule validation to fail (the data violates a business rule).

## Checking validation state

```tsx
function MyNextButton() {
  const { nextDisabled, validation } = useInterview();

  return (
    <button disabled={nextDisabled}>
      {validation.error ? 'Fix errors to continue' : 'Next'}
    </button>
  );
}
```

`nextDisabled` is the safest check — it already accounts for both validation systems plus loading state. Use `validation.error` / `validation.warning` only when you need to customise UI based on the specific type.
