# @imminently/interview-ui

A React UI component library for building interview experiences on top of [@imminently/interview-sdk](../core). This package provides ready-to-use React components with built-in styling, form management, and state handling.

> **Built with**: Tailwind CSS, Radix UI primitives, and React Hook Form

## Key Features

- 🎨 **Pre-styled Components** - Beautiful, accessible interview UI out of the box
- 🧩 **Slot-based Customization** - Replace any component with your own implementation
- 📋 **Form Management** - Built-in form handling with validation
- 🎯 **TypeScript Support** - Fully typed for better developer experience
- 🔌 **Flexible Styling** - Use with Tailwind or standalone CSS
- ♿ **Accessible** - Built on Radix UI primitives following WAI-ARIA standards

## Installation

```bash
# npm
npm install @imminently/interview-ui @imminently/interview-sdk react react-dom react-hook-form

# yarn
yarn add @imminently/interview-ui @imminently/interview-sdk react react-dom react-hook-form

# pnpm
pnpm add @imminently/interview-ui @imminently/interview-sdk react react-dom react-hook-form

# bun
bun add @imminently/interview-ui @imminently/interview-sdk react react-dom react-hook-form
```

## Setup

### With Tailwind CSS (Recommended)

If you're using Tailwind CSS in your project, you need to include our package in your content sources:

```css
/* app.css or main.css */
@import "tailwindcss";

/* Add our package as a source for Tailwind to scan */
@source "../node_modules/@imminently/interview-ui";
```

This ensures Tailwind generates the necessary utility classes for our components.

### Without Tailwind CSS

If you're not using Tailwind, import our pre-built CSS file:

```tsx
// main.tsx or App.tsx
import '@imminently/interview-ui/dist/index.css';
```

### Z-Index Override

Set `--interview-ui-z-index` anywhere in your app to move the library's overlay layers above or below your own UI.

```css
:root {
  --interview-ui-z-index: 2000;
}
```

Dialogs, sheets, popovers, tooltips, selects, and other internal layered UI derive their stack order from this variable.

## Quick Start

### Basic Usage

The simplest way to get started is with the default layout:

```tsx
import { Interview } from '@imminently/interview-ui';
import { useMemo } from 'react';

function App() {
  // Use useMemo to prevent unnecessary re-renders
  const options = useMemo(() => ({
    apiManager: {
      host: 'https://api.example.com',
      auth: async () => ({
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    fileManager: {
      host: 'https://api.example.com',
      auth: async () => ({
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    init: async (manager) => {
      await manager.create({
        project: 'my-project',
        release: 'v1.0'
      });
    }
  }), []); // Add dependencies if needed

  return (
    <Interview options={options} />
  );
}
```

> **Important**: Always memoize the `options` object to prevent unnecessary re-renders of the Interview component.

### Using Compositional Components

For more control over the layout, use the compositional API:

```tsx
import { Interview } from '@imminently/interview-ui';
import { useMemo } from 'react';

function App() {
  const options = useMemo(() => ({
    apiManager: {
      host: 'https://api.example.com',
      auth: async () => ({
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    fileManager: {
      host: 'https://api.example.com',
      auth: async () => ({
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    init: async (manager) => {
      await manager.create({
        project: 'my-project',
        release: 'v1.0'
      });
    }
  }), []);

  return (
    <Interview options={options}>
      <div className="flex flex-col h-screen">
        <header className="p-4 bg-primary text-primary-foreground">
          <h1>My Interview</h1>
        </header>
        
        <div className="flex-1 overflow-auto">
          <Interview.Error />
          <Interview.Loading />
          <Interview.Content>
            <Interview.Steps />
            <Interview.Form />
            <Interview.Validations />
          </Interview.Content>
        </div>
        
        <footer className="flex gap-2 p-4 border-t">
          <Interview.Back />
          <Interview.Reset />
          <Interview.Progress />
          <Interview.Next />
        </footer>
      </div>
    </Interview>
  );
}
```

`Interview.Form` owns submission. `Interview.Next` renders a submit button (`type="submit"`), so it should be used with an `Interview.Form` in the same layout rather than calling `manager.next()` itself.

## Core Components

All components are available under the `Interview.*` namespace:

### Interview.Root (InterviewProvider)

The root provider that manages interview state and context.

> **Note**: This is useful when you want to manage the `SessionManager` instance yourself, or allow components outside the interview tree to access the manager.

```tsx
import { SessionManager } from '@imminently/interview-sdk';
import { Interview } from '@imminently/interview-ui';

const manager = new SessionManager(options);

function App() {
  return (
    <Interview.Root manager={manager}>
      {/* Your interview UI */}
    </Interview.Root>
  );
}
```

### Interview.Content

Wrapper component that handles loading, error, and success states.

```tsx
<Interview.Content>
  <Interview.Form />
</Interview.Content>
```

### Interview.Form

Renders the form controls for the current screen and owns form submission. When the form submits, it calls `manager.next(data)` with the current form values.

`Interview.Next` is designed to work with this component by rendering a submit button, so clicking `Interview.Next` or pressing Enter inside the form submits `Interview.Form`.

```tsx
<Interview.Form />
```

### Interview.Steps

Displays the interview step navigation in the default sidebar layout, including a progress bar in the footer.

```tsx
<Interview.Steps />
```

#### Sub-step support

Steps can be recursive — each step may contain a `steps` array of child steps. Use `showSubSteps` to render them:

```tsx
// Show all sub-steps at every depth
<Interview.Steps showSubSteps />

// Show only one level of children
<Interview.Steps showSubSteps={1} />

// Show up to two levels deep
<Interview.Steps showSubSteps={2} />
```

#### Custom item rendering

Use `renderStep` to replace the default sidebar item markup. The function receives:
- `step` — the step data
- `index` — 0-based position within its sibling group
- `depth` — nesting depth (0 = top-level)
- `navigate` — call to navigate to that step
- `children` — the pre-rendered sub-step tree (`null` if none)

```tsx
<Interview.Steps
  renderStep={({ step, index, navigate, children }) => (
    <SidebarMenuItem key={step.id}>
      <SidebarMenuButton onClick={navigate}>
        {index + 1}. {step.title}
      </SidebarMenuButton>
      {children}
    </SidebarMenuItem>
  )}
/>
```

#### InterviewStepList

For advanced layouts — custom sidebars, drawers, sheets — use `InterviewStepList` directly instead of `Interview.Steps`. It renders only the step menu items without any sidebar chrome:

```tsx
import { InterviewStepList } from '@imminently/interview-ui';

// Inside a custom sidebar
<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Steps</SidebarGroupLabel>
      <InterviewStepList showSubSteps={2} />
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

`InterviewStepList` accepts the same `showSubSteps` and `renderStep` props as `Interview.Steps`, plus an optional `steps` override to render a custom step subset instead of those from the active session.

### Interview.Next / Interview.Back / Interview.Reset

Navigation buttons for moving through the interview or restarting it.

`Interview.Next` does not advance the interview by itself. It renders a submit button and relies on the surrounding `Interview.Form` submit handler to perform `manager.next(data)`.

```tsx
<Interview.Back className="custom-class" />
<Interview.Reset className="custom-class" />
<Interview.Next className="custom-class" />
```

`Interview.Reset` calls `manager.reset()` and is useful when you want to restart the current interview from the same create/load config.

### Interview.Progress

Shows interview completion progress.

```tsx
<Interview.Progress />
```

### Interview.Validations

Displays validation messages (errors/warnings).

```tsx
<Interview.Validations />
```

### Interview.Loading / Interview.Error

Fallback components for loading and error states.

```tsx
<Interview.Loading />
<Interview.Error />
```

### Interview.Processing

Shows when an async operation is in progress.

```tsx
<Interview.Processing />
```

## Lifecycle Hooks

The UI package exposes React hooks that subscribe to the core lifecycle events for you.

```tsx
import {
  useInterviewComplete,
  useInterviewLifecycleEvent,
  useInterviewSessionUpdate,
} from '@imminently/interview-ui';

function InterviewEffects() {
  useInterviewSessionUpdate(({ session, source }) => {
    console.log('updated from', source, session.screen.id);
  });

  useInterviewComplete(({ session }) => {
    console.log('complete', session.sessionId);
  });

  useInterviewLifecycleEvent('error', ({ error, source }) => {
    console.error('manager error', source, error);
  });

  return null;
}
```

Available hooks include:

- `useInterviewLifecycleEvent`
- `useInterviewSessionStart`
- `useInterviewCreate`
- `useInterviewLoad`
- `useInterviewReset`
- `useInterviewSessionUpdate`
- `useInterviewComplete`
- `useInterviewError`
- `useInterviewActiveSessionChange`

## Customization

### Using Custom Components (Slots)

Replace any built-in control with your own implementation using the `slots` prop:

```tsx
import { Interview } from '@imminently/interview-ui';
import { MyCustomTextInput } from './components/MyCustomTextInput';
import { MyCustomDatePicker } from './components/MyCustomDatePicker';

function App() {
  return (
    <Interview
      options={managerOptions}
      slots={{
        text: MyCustomTextInput,
        date: MyCustomDatePicker,
        // Override any control type
      }}
    />
  );
}
```

### Available Slot Types

You can override any of these control types:

- `text`, `textarea`, `number`, `currency`
- `boolean` (checkbox/toggle)
- `date`, `datetime`, `time`
- `select`, `radio`
- `file`
- `image`, `document`
- `typography`, `explanation`
- `renderValue` (for display-only values)

### Building Custom Controls

If you're building custom controls, we provide form utilities to help:

```tsx
import { FormField, FormControl, FormLabel, FormMessage, useFormField } from '@imminently/interview-ui';
import type { TextControl } from '@imminently/interview-sdk';

export const MyCustomTextInput = ({ field }: { field: any }) => {
  return (
    <>
      <FormLabel>{field.control.label}</FormLabel>
      <FormControl>
        <input
          type="text"
          {...field}
          className="custom-input"
        />
      </FormControl>
      <FormMessage />
    </>
  );
};
```

> **Note** The core InterviewControl auto wraps everything in a `FormField` component. This means you only need to use `FormControl`, `FormLabel`, and `FormMessage` inside your custom control.

### Form Components

These components help you build custom controls that integrate with our form system:

- `FormField` - Wrapper for form fields with context
- `FormLabel` - Accessible label component
- `FormControl` - Wrapper for input elements
- `FormMessage` - Display validation messages
- `FormDescription` - Display help text
- `useFormField` - Hook to access field state and control data

> **Note**: Some logic from our built-in controls may need to be re-implemented. We recommend using our controls as examples/guidance.

## Configuration

### InterviewConfig

```tsx
interface InterviewConfig {
  // React Hook Form configuration
  form?: {
    mode?: 'onBlur' | 'onChange' | 'onSubmit';
    reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
    shouldFocusError?: boolean;
  };
  
  // Theme customization (advanced)
  // NOTE unused in current version, coming in future updates
  theme?: Record<string, any>;
  
  // Icon replacements
  icons?: Record<string, React.ComponentType<{ className?: string }>>;
  
  // Custom control components
  slots?: {
    text?: React.FC<any>;
    date?: React.FC<any>;
    // ... other control types
  };
  
  // Callbacks
  callbacks?: {
    onDebugControlClick?: (control: Control, interview: InterviewContext) => void;
  };
  
  // Display inline error messages
  inlineErrors?: boolean;
}
```

### Example with Configuration

```tsx
<Interview
  options={managerOptions}
  form={{
    mode: 'onChange',
    shouldFocusError: true
  }}
  inlineErrors={true}
  slots={{
    text: CustomTextInput
  }}
  callbacks={{
    onDebugControlClick: (control, context) => {
      console.log('Control clicked:', control);
    }
  }}
/>
```

## Hooks

### useInterview

Access interview state and manager from any child component:

```tsx
import { useInterview } from '@imminently/interview-ui';

function MyComponent() {
  const interview = useInterview();
  
  return (
    <div>
      <p>Status: {interview.session.status}</p>
      <p>Step: {interview.session.screen.title}</p>
      <button
        disabled={interview.nextDisabled}
        onClick={() => interview.manager.next({})}
      >
        Next
      </button>
    </div>
  );
}
```

### InterviewContextState

```tsx
interface InterviewContextState {
  manager: SessionManager;           // The session manager instance
  session: Session;                  // Current session data
  state: 'loading' | 'error' | 'success';
  error?: Error;
  validation: {
    error: boolean;                  // Has validation errors
    warning: boolean;                // Has validation warnings
  };
  isLoading: boolean;                // External operation in progress
  backDisabled: boolean;             // Should back button be disabled
  nextDisabled: boolean;             // Should next button be disabled
  callbacks: InterviewCallbacks;
}
```

## Advanced Usage

### Debug Mode

Set `debug: true` in options to enable debug mode. This mounts the debug panel and activates the keyboard shortcut — debug starts disabled and must be toggled on by the user:

```tsx
<Interview
  options={{
    ...managerOptions,
    debug: true  // Unlocks debug mode; press Ctrl+D (or Cmd+D) to activate
  }}
/>
```

Once activated with `Ctrl+D`, a floating debug panel appears with tabs for session data, form state, validations, and more. Press `` ` `` to toggle advanced debug overlays on containers. Shift-click any control to inspect it.

### Internationalization

Set a custom translation function:

```tsx
import { setTranslateFn } from '@imminently/interview-ui';

setTranslateFn((key) => {
  return i18n.t(key); // Your i18n implementation
});
```

> **Note**: This should be done once at the application entry point.

### Read-only Mode

Display an interview without allowing user input:

```tsx
<Interview
  options={managerOptions}
  readOnly={true}
/>
```

## Examples

### Full Custom Layout

```tsx
import { Interview, useInterview } from '@imminently/interview-ui';

function CustomInterviewLayout() {
  const { session } = useInterview();
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{session.screen.title}</h1>
      
      <Interview.Validations />
      
      <Interview.Form className="space-y-6" />
      
      <div className="flex justify-between mt-8">
        <Interview.Back asChild>
          <button className="btn btn-secondary">
            Previous
          </button>
        </Interview.Back>

        <Interview.Reset asChild>
          <button className="btn btn-secondary">
            Start Over
          </button>
        </Interview.Reset>
        
        <Interview.Progress />
        
        <Interview.Next asChild>
          <button className="btn btn-primary">
            Continue
          </button>
        </Interview.Next>
      </div>
    </div>
  );
}

function App() {
  return (
    <Interview.Root manager={manager}>
      <CustomInterviewLayout />
    </Interview.Root>
  );
}
```

> **Tip**: Use the `asChild` prop on `Interview.Back`, `Interview.Reset`, and `Interview.Next` to inject onClick handlers and disabled state into your own button components automatically.

## TypeScript

The package is fully typed. Import types as needed:

```tsx
import type {
  InterviewConfig,
  InterviewContextState,
  InterviewProviderProps
} from '@imminently/interview-ui';
```

## Publishing (For Maintainers)

To publish a new version of the UI SDK package, run the following command from the `packages/ui` directory:

```bash
bun install
bun run deploy
```

This will:

1. Build the package (including CSS)
2. Bump the patch version
3. Publish to the GitHub Package Registry

## Related Packages

- **[@imminently/interview-sdk](../core)** - Core SDK that this library is built on

## License

See [LICENSE](../../LICENSE) file in the repository root.
