# Customization

Four levels of customization, from least to most effort:

## 1. Layout composition

Keep all default controls, rearrange the layout using compositional components:

```tsx
<Interview options={options}>
  <div className="grid grid-cols-[280px_1fr] h-screen">
    <aside className="p-6 bg-slate-50 border-r">
      <Interview.Steps />
      <Interview.Progress />
    </aside>

    <main className="flex flex-col overflow-auto">
      <Interview.Error />
      <Interview.Loading />
      <Interview.Content>
        <div className="max-w-2xl mx-auto p-8">
          <Interview.Validations className="mb-6" />
          <Interview.Form className="space-y-6" />
        </div>
      </Interview.Content>

      <footer className="flex gap-4 p-4 border-t">
        <Interview.Back />
        <Interview.Reset />
        <Interview.Next />
      </footer>
    </main>
  </div>
</Interview>
```

## 2. Control replacement (slots)

Replace specific control types with custom implementations while keeping everything else:

```tsx
<Interview
  options={options}
  slots={{
    text: MyCustomTextInput,
    date: MyCustomDatePicker,
    boolean: MyCustomToggle,
    currency: MyCustomCurrencyInput,
  }}
/>
```

Available slot types: `text`, `textarea`, `number`, `currency`, `boolean`, `date`, `datetime`, `time`, `select`, `radio`, `file`, `image`, `document`, `typography`, `explanation`, `renderValue`

## 3. Building custom controls

Custom controls receive a `field` prop from React Hook Form. The parent `FormField` wrapper is already applied — you only need `FormLabel`, `FormControl`, and `FormMessage`.

```tsx
import { FormControl, FormLabel, FormMessage, FormDescription } from '@imminently/interview-ui';

export const MyCustomTextInput = ({ field }: { field: any }) => {
  const { control, value, onChange, onBlur, disabled, required } = field;

  return (
    <>
      <FormLabel>
        {control.label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>

      <FormControl>
        <input
          type="text"
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={control.caption}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </FormControl>

      <FormMessage />  {/* shows validation errors */}

      {control.help && (
        <FormDescription>{control.help}</FormDescription>
      )}
    </>
  );
};
```

Form utilities exported from `@imminently/interview-ui`:
- `FormField` — wrapper providing form context (already applied by parent)
- `FormLabel` — accessible label
- `FormControl` — wrapper for the input element
- `FormMessage` — validation error display
- `FormDescription` — help text
- `useFormField` — hook to access field state and control metadata

## 4. Full custom UI with useInterview

Build an entirely custom UI while the SDK handles all state and API communication:

```tsx
import { useInterview } from '@imminently/interview-ui';

function CustomInterviewUI() {
  const {
    manager,       // SessionManager instance
    session,       // current Session
    state,         // 'loading' | 'error' | 'success'
    error,         // Error if state === 'error'
    nextDisabled,  // boolean
    backDisabled,  // boolean
    isLoading,     // async operation in progress
    validation,    // { error: boolean, warning: boolean }
  } = useInterview();

  if (state === 'loading') return <MySpinner />;
  if (state === 'error') return <MyError error={error} />;

  return (
    <div>
      <h1>{session.screen.title}</h1>

      {session.screen.controls.map(control => (
        <MyControl key={control.id} control={control} />
      ))}

      <button disabled={backDisabled} onClick={() => manager.back()}>
        Back
      </button>
      <button disabled={nextDisabled} onClick={() => manager.next({})}>
        Next
      </button>
    </div>
  );
}

// Must be wrapped in Interview.Root
function App() {
  const manager = useMemo(() => new SessionManager(options), []);

  return (
    <Interview.Root manager={manager}>
      <CustomInterviewUI />
    </Interview.Root>
  );
}
```

`useInterview()` must be called inside a component that's a descendant of `<Interview>` or `<Interview.Root>`. It throws if used outside that context.

## useInterview return value

```typescript
interface InterviewContextState {
  manager: SessionManager;
  session: Session;
  state: 'loading' | 'error' | 'success';
  error?: Error;
  validation: { error: boolean; warning: boolean };
  isLoading: boolean;      // external operation in progress
  backDisabled: boolean;
  nextDisabled: boolean;
  callbacks: InterviewCallbacks;
}
```

## Reading form values inside the tree

```tsx
import { useFormContext } from 'react-hook-form';

function MyComponent() {
  const { watch, getValues } = useFormContext();

  const username = watch('username');   // reactive
  const all = getValues();              // snapshot

  return <div>Username: {username}</div>;
}
```
