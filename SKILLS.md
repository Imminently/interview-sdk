---
name: interview-sdk
description: Comprehensive guide for implementing and customizing the @imminently/interview-sdk and @imminently/interview-ui packages.
---

# Interview SDK UI Implementation Guide

This document provides essential knowledge for AI assistants to effectively implement and customize the @imminently/interview-sdk and @imminently/interview-ui packages.

## Required Packages

You must install and use **both** packages:

```bash
npm install @imminently/interview-sdk @imminently/interview-ui
# or
yarn add @imminently/interview-sdk @imminently/interview-ui
```

**Package Responsibilities:**
- **@imminently/interview-sdk** - Core business logic, SessionManager, types, and API communication
- **@imminently/interview-ui** - React UI components built on top of the SDK

## Architecture Overview

### Core Packages

1. **@imminently/interview-sdk** (`packages/core/`) - Core logic layer
   - `SessionManager` - Main state management class
   - `ManagerOptions` - Configuration interface for SessionManager
   - API communication and session lifecycle
   - Types and interfaces for controls, screens, and state
   - **Imports**: `import { SessionManager } from "@imminently/interview-sdk"`
   - **Imports**: `import type { ManagerOptions } from "@imminently/interview-sdk"`

2. **@imminently/interview-ui** (`packages/ui/`) - React UI layer
   - Pre-built React components
   - Form management with React Hook Form
   - Tailwind CSS styling
   - Radix UI primitives for accessibility
   - **Imports**: `import { Interview } from "@imminently/interview-ui"`

### Component Hierarchy

```
<Interview> (Main wrapper)
  ├── <Interview.Root> (InterviewProvider - Context provider)
  │   └── SessionManager instance
  ├── <Interview.Error> (Error display)
  ├── <Interview.Loading> (Loading state)
  ├── <Interview.Processing> (Async operations indicator)
  └── <Interview.Content> (Main content wrapper)
      ├── <Interview.Steps> (Breadcrumb navigation)
      ├── <Interview.Form> (Form controls renderer)
      │   └── <RenderControl> (Per-control renderer)
      │       └── Individual control components (text, date, boolean, etc.)
      ├── <Interview.Validations> (Error/warning messages)
      └── Navigation & Progress
          ├── <Interview.Back>
          ├── <Interview.Next>
          └── <Interview.Progress>
```

## Core SDK Deep Dive

### Understanding the Interview System

Before diving into implementation, understand these core concepts:

**Interview**: A form/questionnaire designed to collect information. Built in Decisively or auto-generated.

**Session**: The stateful interaction between your app and the API. Each session:
- Represents a user's progress through an interview
- Has a unique `sessionId` (GUID)
- Can be persisted and resumed with `load()`
- Contains all current state, controls, and user data

**Interaction**: Each session can have multiple interactions. An interview is one interaction. Each has a unique `interactionId` needed for resuming.

**Screens & Controls**: Form presented as series of screens, each with controls (inputs, dropdowns, etc.). You get:
- `steps` - Array of all steps in the interview
- `screen` - Current active screen with controls
- `controls` - Form elements to render (within screen)

**Dynamic Updates**: Both client-side and server-side supported. Client-side is faster (recommended). Enable with `preCacheClient: true`.

### Creating a SessionManager

**Import Location**:
```tsx
// Core SDK imports
import { SessionManager } from "@imminently/interview-sdk";
import type { ManagerOptions, Session, Screen, Control } from "@imminently/interview-sdk";
```

**Basic Setup**:
```tsx
const manager = new SessionManager({
  // Required: API configuration
  apiManager: {
    host: 'https://api.decisively.io', // Or your proxy (recommended)
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getLatestToken()}`
      }
    })
  },

  // Required for file uploads
  fileManager: {
    host: 'https://api.decisively.io',
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getLatestToken()}`
      }
    })
  },

  // Optional: Enable debug logging
  debug: true,

  // Optional: Pre-cache client-side dynamic runtime
  preCacheClient: true,

  // Optional: Initialize session
  init: async (manager) => {
    // Option 1: Create new session
    await manager.create({
      project: 'my-project', // Name or GUID
      release: 'v1.0',       // Optional: specific release
      initialData: {}        // Optional: pre-fill data
    });

    // Option 2: Load existing session
    // await manager.load({
    //   project: 'my-project',
    //   sessionId: 'existing-guid',
    //   interactionId: 'interaction-guid'
    // });
  },

  // Optional: Session persistence
  sessionStore: {
    get: () => JSON.parse(localStorage.getItem('session') || '{}'),
    set: (value) => localStorage.setItem('session', JSON.stringify(value))
  },

  // Optional: Read-only mode
  readOnly: false
});
```

### ManagerOptions Interface

**Complete Type Definition**:
```tsx
interface ManagerOptions {
  apiManager: ApiManager | ApiManagerOptions;
  fileManager?: FileManager | FileManagerOptions;
  init?: (manager: SessionManager) => void | Promise<void>;
  debug?: boolean;
  preCacheClient?: boolean;
  sessionStore?: Storage;
  readOnly?: boolean;
}
```

**ApiManagerOptions**:
```tsx
interface ApiManagerOptions {
  host: string;                    // API base URL
  path?: string[];                 // Custom path segments (default: ['decisionapi', 'session'])
  auth: () => Promise<AuthData> | AuthData;
  overrides?: AxiosRequestConfig;  // Axios config overrides
  apiGetters?: {                   // Custom endpoint overrides
    create?: (options) => string;
    load?: (options) => string;
    submit?: (options) => string;
    // ... other endpoints
  };
}

interface AuthData {
  headers?: Record<string, string>;
  token?: string;                  // Will be added as Authorization header
  tenancy?: string;                // Will be added as X-Tenancy header
}
```

**FileManagerOptions**:
```tsx
interface FileManagerOptions {
  host: string;
  filePath?: string[];             // Default: ['decisionapi', 'file']
  auth?: () => Promise<AuthData> | AuthData;
}
```

### Using a Proxy (Recommended)

**IMPORTANT**: Do NOT call Decisively APIs directly from client-side code in production.

**Why**:
- Decisively API is powerful - can access/manipulate sessions, control behavior, request expanded data
- Uses high-privilege credentials (power user equivalent)
- Exposing credentials in client = security risk + data leakage risk
- Users can extract tokens, call unintended APIs, access internal logic

**Best Practice**: Use your own backend proxy:

```
Client UI → Your Backend Proxy → Decisively API
```

**Benefits**:
- Keep Decisively credentials private (server-side only)
- Control and validate requests (which endpoints, parameters, options)
- Prevent data over-exposure (filter out internal metadata, rules, graphs)
- Apply your own security rules (auth, rate limiting, auditing)

**SDK Configuration for Proxy**:
```tsx
const options: ManagerOptions = {
  apiManager: {
    host: 'https://api.yourcompany.com', // Your proxy
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${yourAppToken}` // Your app's token
      }
    })
  }
};
```

Your backend then maps requests to Decisively using its secure credentials.

### SessionManager Methods

**Session Lifecycle**:
```tsx
// Create new session
await manager.create({
  project: 'my-project',
  release?: 'v1.0',
  initialData?: { attr: 'value' },
  sessionId?: 'custom-guid',
  responseElements?: ['data', 'screen']
});

// Load existing session
await manager.load({
  project: 'my-project',
  sessionId: 'session-guid',
  interactionId: 'interaction-guid',
  initialData?: {}
});
```

**Navigation**:
```tsx
// Submit and navigate to next screen
await manager.next({ attribute: 'value' });

// Go back to previous screen
await manager.back();

// Jump to specific step
await manager.navigate('step-id');

// Submit without navigation
await manager.submit({ attribute: 'value' }, false);
```

**State Management**:

> **⚠️ IMPORTANT for React**: If you're using React, DO NOT manually subscribe to the SessionManager. The UI layer (`@imminently/interview-ui`) provides `InterviewContext` which uses `useSyncExternalStore` internally to handle subscriptions efficiently and correctly. Always use the `useInterview()` hook in React components. Manual subscription should only be used as an extreme fallback or when you need access outside of React (e.g., Node.js, testing environments, non-React frameworks).

```tsx
// ❌ WRONG in React - Don't manually subscribe
const unsubscribe = manager.subscribe(() => {
  const snapshot = manager.getSnapshot();
  // ... this will cause issues with React's render cycle
});

// ✅ CORRECT in React - Use the hook
import { useInterview } from '@imminently/interview-ui';

function MyComponent() {
  const { manager, session, state } = useInterview();
  // State is automatically synchronized via useSyncExternalStore
  return <div>{session.screen.title}</div>;
}

// ✅ CORRECT outside React - Manual subscription
const unsubscribe = manager.subscribe(() => {
  const snapshot = manager.getSnapshot();
  console.log(snapshot.state);      // 'loading' | 'error' | 'success'
  console.log(snapshot.session);    // Current session
  console.log(snapshot.loading);    // External operation in progress
  console.log(snapshot.renderAt);   // Last update timestamp
});

// Access current session
const session = manager.session;
console.log(session.screen);        // Current screen
console.log(session.steps);         // All steps
console.log(session.status);        // 'in-progress' | 'complete' | 'error'
console.log(session.data);          // Current attribute values

// Utility properties
manager.isComplete;                 // Interview complete?
manager.isLastStep;                 // On last step?
manager.canProgress;                // Can proceed?
manager.activeSession;              // Current session (may be sub-interview)
manager.isSubInterview;             // In a sub-interview?
```

**File Operations**:
```tsx
// Upload file
const result = await manager.uploadFile({
  name: 'document.pdf',
  data: 'data:application/pdf;base64,JVBERi0xLj...'
});
// Returns: { reference: 'data:id={uuid};base64,...', id: 'uuid' }

// Download file
const fileData = await manager.downloadFile('file-reference-id');

// Remove file
await manager.removeFile('file-reference-id');

// Handle file size errors
manager.onFileTooBig = (file) => {
  console.error(`File ${file.name} too large`);
};
```

**Advanced Features**:
```tsx
// Sub-interviews
await manager.createSubInterview(interviewControl);

// Template text (replace placeholders)
const text = manager.templateText(
  'Hello {{name}}, age {{age}}',
  { name: 'John', age: 30 }
);

// Get explanations
const explanation = manager.getExplanation('attribute_id');

// Debug controls
manager.setDebugEnabled(true);
manager.setAdvancedDebugEnabled(true);
```

**Chat (Experimental)**:
```tsx
const response = await manager.chat(
  'complete-profile',              // goal
  'What information needed?',      // message
  'interaction-id'                 // optional existing interaction
);
```

### Session Object Structure

```tsx
interface Session {
  sessionId: string;
  interactionId?: string;
  status: 'in-progress' | 'complete' | 'error';
  screen: Screen;
  steps: Step[];
  data: AttributeValues;
  progress?: {
    percentage: number;
    canGoBack: boolean;
    canGoForward: boolean;
  };
  complete: boolean;
  // ... other properties
}

interface Screen {
  id: string;
  title?: string;
  controls: Control[];
  // ... other properties
}

interface Control {
  id: string;
  type: string;                    // 'text', 'date', 'boolean', 'select', etc.
  attribute: string;
  label?: string;
  value?: any;
  required?: boolean;
  disabled?: boolean;
  help?: string;
  // ... type-specific properties
}
```

## Key Concepts

### 1. SessionManager (Core SDK)

The `SessionManager` is the brain of the interview system. It:
- Manages interview lifecycle (create, navigate, submit)
- Handles API communication
- Maintains current session state
- Processes user input and returns updated screens

**Critical**: Never create a SessionManager inside a component render function without memoization - it will cause infinite re-renders.

### 2. Context Pattern

The UI layer uses React Context (`InterviewContext`) to share the SessionManager and session state. It uses React's `useSyncExternalStore` internally to efficiently synchronize the SessionManager's state with React's render cycle.

```tsx
// Access interview state anywhere in the component tree
const { manager, session, state, nextDisabled, backDisabled } = useInterview();
```

**How it works**: The `InterviewContext` automatically subscribes to the SessionManager and updates React components when state changes. You never need to manually call `manager.subscribe()` in React - the hook handles this for you.

### 3. Options Object Pattern (UI Layer)

**CRITICAL**: Always memoize the `options: ManagerOptions` object passed to `<Interview>`:

```tsx
import { useMemo } from 'react';
import type { ManagerOptions } from '@imminently/interview-sdk';

// ✅ CORRECT - Memoized
const options: ManagerOptions = useMemo(() => ({
  apiManager: {
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
}), [token]); // Add dependencies

<Interview options={options} />

// ❌ WRONG - Creates new object every render
const options = {
  apiManager: { /* ... */ }
};
<Interview options={options} /> // Will cause infinite re-renders
```

**Why**: Creating a new options object on every render causes the Interview component to reinitialize the SessionManager repeatedly, leading to performance issues and API spam.

### 4. Two Usage Patterns (UI Layer)

**Pattern A: Simple (Managed SessionManager)**
```tsx
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

// Interview component creates and manages SessionManager internally
const options: ManagerOptions = useMemo(() => ({ /* ... */ }), []);

<Interview options={options}>
  <Interview.Content />
</Interview>
```

**Pattern B: Advanced (External SessionManager)**
```tsx
import { Interview } from '@imminently/interview-ui';
import { SessionManager } from '@imminently/interview-sdk';
import type { ManagerOptions } from '@imminently/interview-sdk';

// You create and manage SessionManager yourself
const options: ManagerOptions = { /* ... */ };
const manager = new SessionManager(options);

<Interview.Root manager={manager}>
  <Interview.Content />
</Interview.Root>
```

Use Pattern B when:
- You need to access the manager outside the Interview tree
- You want to initialize the session before rendering
- You're building a wrapper library

## Component Details

### Interview (Main Component)

Props:
- `options: ManagerOptions` - Configuration object (MUST be memoized)
- `slots?: Record<string, React.FC>` - Custom control components
- `form?: { mode, reValidateMode, shouldFocusError }` - React Hook Form config
- `inlineErrors?: boolean` - Show validation errors inline on controls
- `readOnly?: boolean` - Disable all inputs
- `callbacks?: { onDebugControlClick }` - Event callbacks
- `children?: React.ReactNode` - Custom layout components

### Interview.Root (InterviewProvider)

Props:
- `manager: SessionManager` - Pre-created manager instance
- `children: React.ReactNode`
- `config?: InterviewConfig` - Same config as Interview component

### Interview.Content

Conditional renderer that handles three states:
1. `loading` - Shows `<Interview.Loading>`
2. `error` - Shows `<Interview.Error>`
3. `success` - Renders children (the actual form)

**Pattern**: Always wrap your form content in `<Interview.Content>`:

```tsx
<Interview.Content>
  <Interview.Form />
  <Interview.Validations />
</Interview.Content>
```

### Interview.Form

Renders all controls for the current screen using React Hook Form.

**Key behaviors**:
- Automatically handles form state
- Validates on blur/change based on config
- Maps control types to React components
- Applies custom slots if provided

**Structure**:
```tsx
<Interview.Form className="space-y-4">
  {/* Renders each control in session.screen.controls */}
  {/* Each control wrapped in FormField automatically */}
</Interview.Form>
```

### Navigation Components

**Interview.Back / Interview.Next**

Props:
- `className?: string` - Style overrides
- `asChild?: boolean` - Use Radix Slot pattern to merge with child element
- `children?: React.ReactNode` - Custom button content

**Pattern with asChild**:
```tsx
<Interview.Next asChild>
  <button className="my-custom-btn">
    Continue
  </button>
</Interview.Next>
{/* onClick and disabled are automatically injected */}
```

**Interview.Progress**

Shows completion percentage. Customize with `className` prop.

### Interview.Validations

Displays validation errors and warnings from the current session.

**When to use**:
- Always include it somewhere visible in your layout
- Pairs with `inlineErrors={false}` to show errors in one place
- Can be styled with `className` prop

### Interview.Steps

Breadcrumb navigation showing interview progress.

**Features**:
- Shows completed, current, and upcoming steps
- Clickable if navigation is allowed
- Automatically styled with default theme

## Customization Strategies

### Strategy 1: Layout Customization (Composition)

Keep all default controls but arrange them differently:

```tsx
<Interview options={options}>
  <div className="grid grid-cols-[300px_1fr]">
    <aside className="p-4 bg-slate-100">
      <Interview.Steps />
      <Interview.Progress />
    </aside>
    
    <main className="p-8">
      <Interview.Content>
        <h1 className="text-3xl">{session.screen.title}</h1>
        <Interview.Validations />
        <Interview.Form />
        <div className="flex gap-4 mt-6">
          <Interview.Back />
          <Interview.Next />
        </div>
      </Interview.Content>
    </main>
  </div>
</Interview>
```

### Strategy 2: Control Replacement (Slots)

Replace specific control types with custom implementations:

```tsx
const slots = {
  // Replace the text input control
  text: MyCustomTextInput,
  
  // Replace the date picker
  date: MyCustomDatePicker,
  
  // Replace any control type...
  boolean: MyCustomToggle,
  currency: MyCustomCurrencyInput,
};

<Interview options={options} slots={slots} />
```

**Available slot types**:
- `text`, `textarea`, `number`, `currency`
- `boolean` (checkbox/toggle)
- `date`, `datetime`, `time`
- `select`, `radio`
- `file`, `image`, `document`
- `typography`, `explanation`
- `renderValue` (display-only)

### Strategy 3: Custom Control Implementation

When creating custom controls:

```tsx
import { FormControl, FormLabel, FormMessage } from '@imminently/interview-ui';

export const MyCustomTextInput = ({ field }) => {
  // field comes from React Hook Form with control data
  const { control, value, onChange, onBlur, disabled, required } = field;
  
  return (
    <>
      <FormLabel>
        {control.label}
        {required && <span className="text-red-500">*</span>}
      </FormLabel>
      
      <FormControl>
        <input
          type="text"
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="custom-input-class"
        />
      </FormControl>
      
      <FormMessage /> {/* Shows validation errors */}
      
      {control.help && (
        <FormDescription>{control.help}</FormDescription>
      )}
    </>
  );
};
```

**Key points**:
- The `FormField` wrapper is already applied by the parent
- You only need `FormLabel`, `FormControl`, `FormMessage`
- The `field` prop contains both React Hook Form props and control metadata
- Access control metadata via `field.control` (label, help, required, etc.)

### Strategy 4: Complete Custom Layout with useInterview Hook

Build entirely custom UI while leveraging the SDK:

```tsx
import { useInterview } from '@imminently/interview-ui';

function CustomInterviewUI() {
  const {
    manager,      // SessionManager instance
    session,      // Current session data
    state,        // 'loading' | 'error' | 'success'
    error,        // Error object if state === 'error'
    nextDisabled, // Should next button be disabled
    backDisabled, // Should back button be disabled
    validation,   // { error: boolean, warning: boolean }
  } = useInterview();
  
  if (state === 'loading') return <MyLoadingSpinner />;
  if (state === 'error') return <MyErrorDisplay error={error} />;
  
  return (
    <div>
      <h1>{session.screen.title}</h1>
      
      {/* Custom form rendering */}
      {session.screen.controls.map(control => (
        <MyCustomControl key={control.id} control={control} />
      ))}
      
      {/* Custom navigation */}
      <button
        disabled={backDisabled}
        onClick={() => manager.back()}
      >
        Previous
      </button>
      
      <button
        disabled={nextDisabled}
        onClick={() => manager.next({})}
      >
        Next
      </button>
    </div>
  );
}

// Must be wrapped in Interview.Root
function App() {
  const manager = new SessionManager(options);
  
  return (
    <Interview.Root manager={manager}>
      <CustomInterviewUI />
    </Interview.Root>
  );
}
```

## Configuration Reference

### Complete ManagerOptions Example

```tsx
import { SessionManager } from '@imminently/interview-sdk';
import type { ManagerOptions } from '@imminently/interview-sdk';

const options: ManagerOptions = {
  // ===== REQUIRED =====
  apiManager: {
    host: 'https://api.decisively.io',
    
    // Auth function - called before each request
    auth: async () => {
      const token = await getLatestToken();
      return {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // OR use these shortcuts:
        // token: token,          // Auto-adds Authorization header
        // tenancy: 'tenant-id'   // Auto-adds X-Tenancy header
      };
    },
    
    // Optional: Custom path segments
    path: ['decisionapi', 'session'],
    
    // Optional: Axios overrides
    overrides: {
      timeout: 30000,
      headers: { 'X-Custom': 'value' }
    },
    
    // Optional: Custom endpoint builders
    apiGetters: {
      create: (opts) => `/custom/create/${opts.project}`,
      load: (opts) => `/custom/load/${opts.project}`,
      submit: (opts) => `/custom/submit`,
      navigate: (opts) => `/custom/navigate`,
      getRulesEngine: (opts) => `/custom/rules?checksum=${opts.checksum}`,
      getConnectedData: () => '/custom/connection'
    }
  },
  
  // ===== OPTIONAL =====
  
  // File upload/download config
  fileManager: {
    host: 'https://api.decisively.io',
    filePath: ['decisionapi', 'file'],
    auth: async () => ({
      headers: { Authorization: `Bearer ${await getToken()}` }
    })
  },
  
  // Initialization function
  init: async (manager) => {
    // Create new session
    await manager.create({
      project: 'my-project',
      release: 'v1.0',
      initialData: {}
    });
    
    // OR load existing
    // await manager.load({
    //   project: 'my-project',
    //   sessionId: 'guid',
    //   interactionId: 'guid'
    // });
  },
  
  // Debug logging
  debug: true,
  
  // Pre-cache client-side dynamic runtime
  preCacheClient: true,
  
  // Session persistence
  sessionStore: {
    get: () => JSON.parse(localStorage.getItem('session') || '{}'),
    set: (value) => localStorage.setItem('session', JSON.stringify(value))
  },
  
  // Read-only mode (no data submission)
  readOnly: false
};

const manager = new SessionManager(options);
```

### ManagerOptions (Core SDK)

```tsx
interface ManagerOptions {
  debug?: boolean;              // Enable debug logging
  preCacheClient?: boolean;     // Pre-cache rules engine
  
  // API configuration
  apiManager: {
    host: string;               // API base URL
    auth: () => Promise<AuthData> | AuthData;
    apiGetters?: {
      simulate?: (params) => string;
      getRulesEngine?: (params) => string;
      getConnectedData?: () => string;
    };
  };
  
  // File upload configuration
  fileManager?: {
    host: string;
    auth?: () => Promise<AuthData> | AuthData;
  };
  
  // Initialization function
  init?: (manager: SessionManager) => Promise<void> | void;
}
```

### InterviewConfig (UI Layer)

```tsx
interface InterviewConfig {
  // React Hook Form settings
  form?: {
    mode?: 'onBlur' | 'onChange' | 'onSubmit';
    reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
    shouldFocusError?: boolean;
  };
  
  // Custom control components
  slots?: Record<string, React.FC<any>>;
  
  // Display options
  inlineErrors?: boolean;       // Show errors on controls vs centralized
  readOnly?: boolean;           // Disable all inputs
  
  // Event callbacks
  callbacks?: {
    onDebugControlClick?: (control: Control, context: InterviewContext) => void;
  };
  
  // Icon overrides
  icons?: Record<string, React.ComponentType<{ className?: string }>>;
  
  // Theme (future feature)
  theme?: Record<string, any>;
}
```

## Complete Implementation Examples

### Example 1: Simple React App with UI Components

```tsx
// App.tsx
import { useMemo } from 'react';
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';
import '@imminently/interview-ui/dist/index.css'; // If not using Tailwind

function App() {
  const token = 'your-auth-token';
  
  // CRITICAL: Memoize options to prevent re-initialization
  const options: ManagerOptions = useMemo(() => ({
    debug: true,
    preCacheClient: true,
    
    apiManager: {
      host: 'https://api.decisively.io',
      auth: async () => ({
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    },
    
    fileManager: {
      host: 'https://api.decisively.io',
      auth: async () => ({
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    },
    
    init: async (manager) => {
      await manager.create({
        project: 'my-project',
        release: 'v1.0'
      });
    }
  }), [token]);

  return (
    <div className="min-h-screen">
      <Interview options={options} inlineErrors>
        <Interview.Error />
        <Interview.Loading />
        <Interview.Content />
      </Interview>
    </div>
  );
}

export default App;
```

### Example 2: Custom Layout with Composition

```tsx
// App.tsx
import { useMemo } from 'react';
import { Interview, useInterview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

function CustomInterviewLayout() {
  const { session, state } = useInterview();
  
  if (state !== 'success') return null;
  
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-50 p-6 border-r">
        <h2 className="text-lg font-bold mb-4">Progress</h2>
        <Interview.Steps />
        <div className="mt-8">
          <Interview.Progress />
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-2">{session.screen.title}</h1>
          <Interview.Validations className="mb-6" />
          <Interview.Form className="space-y-6" />
        </div>
      </main>
      
      {/* Footer navigation */}
      <footer className="fixed bottom-0 right-0 left-80 bg-white border-t p-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          <Interview.Back />
          <Interview.Next />
        </div>
      </footer>
    </div>
  );
}

function App() {
  const options: ManagerOptions = useMemo(() => ({
    apiManager: {
      host: 'https://api.decisively.io',
      auth: async () => ({
        headers: { Authorization: 'Bearer token' }
      })
    },
    init: async (manager) => {
      await manager.create({
        project: 'my-project',
        interview: 'my-interview'
      });
    }
  }), []);

  return (
    <Interview options={options}>
      <Interview.Error />
      <Interview.Loading />
      <Interview.Content>
        <CustomInterviewLayout />
      </Interview.Content>
    </Interview>
  );
}

export default App;
```

### Example 3: External SessionManager with Token Authentication

```tsx
// App.tsx
import { useState, useEffect } from 'react';
import { SessionManager } from '@imminently/interview-sdk';
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

function App() {
  const [manager, setManager] = useState<SessionManager | null>(null);
  const [token, setToken] = useState<string | null>(
    new URLSearchParams(window.location.search).get('token')
  );
  
  useEffect(() => {
    if (!token) return;
    
    const options: ManagerOptions = {
      debug: true,
      apiManager: {
        host: 'https://api.decisively.io',
        auth: async () => ({
          token: `Bearer ${token}`,
          tenancy: 'your-tenancy-id'
        })
      },
      fileManager: {
        host: 'https://api.decisively.io'
      },
      init: async (mgr) => {
        await mgr.create({
          project: 'my-project',
          release: 'v1.0'
        });
      }
    };
    
    const mgr = new SessionManager(options);
    setManager(mgr);
    
    // Cleanup
    return () => {
      // Optional: Add cleanup logic
    };
  }, [token]);
  
  if (!token) {
    return (
      <div className="p-8">
        <h2>Enter Token</h2>
        <input
          type="text"
          placeholder="Your access token"
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
    );
  }
  
  if (!manager) {
    return <div>Initializing...</div>;
  }
  
  return (
    <Interview.Root manager={manager}>
      <Interview.Error />
      <Interview.Loading />
      <Interview.Content />
    </Interview.Root>
  );
}

export default App;
```

### Example 4: Using SessionManager Directly (No UI Components)

```tsx
// headless-interview.ts
import { SessionManager } from '@imminently/interview-sdk';
import type { ManagerOptions, Session } from '@imminently/interview-sdk';

async function runHeadlessInterview() {
  const options: ManagerOptions = {
    apiManager: {
      host: 'https://api.decisively.io',
      auth: async () => ({
        headers: { Authorization: 'Bearer token' }
      })
    }
  };
  
  const manager = new SessionManager(options);
  
  // Subscribe to state changes
  manager.subscribe(() => {
    const snapshot = manager.getSnapshot();
    
    if (snapshot.state === 'success' && snapshot.session) {
      const session = snapshot.session;
      console.log('Current screen:', session.screen.title);
      console.log('Controls:', session.screen.controls);
      console.log('Progress:', session.progress?.percentage);
    }
    
    if (snapshot.state === 'error') {
      console.error('Error:', snapshot.error);
    }
  });
  
  // Create session
  await manager.create({
    project: 'my-project',
    release: 'v1.0'
  });
  
  // Navigate through interview
  await manager.next({
    name: 'John Doe',
    age: 30
  });
  
  await manager.next({
    email: 'john@example.com'
  });
  
  // Check if complete
  if (manager.isComplete) {
    console.log('Interview completed!');
    console.log('Final data:', manager.session.data);
  }
  
  // Go back if needed
  if (!manager.isComplete) {
    await manager.back();
  }
  
  // Jump to specific step
  await manager.navigate('step-2');
}

runHeadlessInterview();
```

### Example 5: Custom Controls with Slots

```tsx
// CustomTextInput.tsx
import { FormControl, FormLabel, FormMessage } from '@imminently/interview-ui';

export const CustomTextInput = ({ field }: any) => {
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
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={control.caption}
        />
      </FormControl>
      
      <FormMessage />
      
      {control.help && (
        <p className="text-sm text-gray-500 mt-1">{control.help}</p>
      )}
    </>
  );
};

// App.tsx
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';
import { CustomTextInput } from './CustomTextInput';
import { useMemo } from 'react';

function App() {
  const options: ManagerOptions = useMemo(() => ({
    apiManager: {
      host: 'https://api.decisively.io',
      auth: async () => ({ headers: { Authorization: 'Bearer token' } })
    },
    init: async (manager) => {
      await manager.create({ project: 'my-project' });
    }
  }), []);

  return (
    <Interview
      options={options}
      slots={{
        text: CustomTextInput,
        // Override other controls as needed
      }}
    >
      <Interview.Content />
    </Interview>
  );
}
```

### Example 6: Using Proxy Backend

```tsx
// App.tsx - Frontend
import { useMemo } from 'react';
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

function App() {
  const userToken = getUserToken(); // Your app's token
  
  const options: ManagerOptions = useMemo(() => ({
    apiManager: {
      host: 'https://api.yourcompany.com', // Your backend proxy
      auth: async () => ({
        headers: {
          Authorization: `Bearer ${userToken}` // Your app's auth
        }
      })
    },
    fileManager: {
      host: 'https://api.yourcompany.com'
    },
    init: async (manager) => {
      await manager.create({
        project: 'my-project',
        release: 'v1.0'
      });
    }
  }), [userToken]);

  return <Interview options={options} />;
}

// backend-proxy.ts - Backend (example with Express)
import express from 'express';
import axios from 'axios';

const app = express();
const DECISIVELY_API = 'https://api.decisively.io';
const DECISIVELY_TOKEN = process.env.DECISIVELY_API_KEY; // Server-side secret

app.post('/decisionapi/session/create', async (req, res) => {
  try {
    // Validate user's token
    const userToken = req.headers.authorization;
    if (!isValidUserToken(userToken)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Forward to Decisively with server credentials
    const response = await axios.post(
      `${DECISIVELY_API}/decisionapi/session/create`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${DECISIVELY_TOKEN}`,
          'X-Tenancy': 'your-tenancy-id'
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ... other proxy endpoints
```

## Common Patterns

### Pattern: Conditional Rendering Based on Session State

```tsx
function CustomLayout() {
  const { session, state } = useInterview();
  
  if (state !== 'success') return null;
  
  // Access current screen data
  const { title, controls } = session.screen;
  const isFirstScreen = !session.progress?.canGoBack;
  const isLastScreen = session.complete;
  
  return (
    <div>
      {isLastScreen && <CompletionMessage />}
      {/* ... rest of UI */}
    </div>
  );
}
```

### Pattern: Custom Navigation with Validation Check

```tsx
function CustomNextButton() {
  const { manager, nextDisabled, validation } = useInterview();
  
  const handleNext = async () => {
    if (validation.error) {
      alert('Please fix errors before continuing');
      return;
    }
    
    // Get form data from somewhere (depends on your implementation)
    const formData = getFormData();
    await manager.next(formData);
  };
  
  return (
    <button disabled={nextDisabled} onClick={handleNext}>
      Continue
    </button>
  );
}
```

### Pattern: Reading Current Form Values

```tsx
import { useFormContext } from 'react-hook-form';

function MyComponent() {
  const { watch, getValues } = useFormContext();
  
  // Watch a specific field
  const username = watch('username');
  
  // Get all values
  const allValues = getValues();
  
  return <div>Current username: {username}</div>;
}
```

### Pattern: Token-based Authentication

```tsx
function App() {
  const [token, setToken] = useState<string | null>(
    new URLSearchParams(window.location.search).get('token')
  );
  
  const options = useMemo(() => {
    if (!token) return null;
    
    return {
      apiManager: {
        host: 'https://api.example.com',
        auth: () => ({
          token: `Bearer ${token}`,
          tenancy: 'your-tenancy-id',
        }),
      },
      init: (manager) => {
        manager.create({
          project: 'project-id',
          interview: 'interview-name',
        });
      },
    };
  }, [token]);
  
  if (!token) return <TokenInput onSubmit={setToken} />;
  if (!options) return null;
  
  return <Interview options={options} />;
}
```

### Pattern: Custom Error Handling

```tsx
function CustomErrorDisplay() {
  const { error } = useInterview();
  
  // Type assertion for extended error properties
  const status = (error as any)?.status;
  
  if (status === 401 || status === 403) {
    // Clear token and redirect to login
    window.location.href = '/login';
    return null;
  }
  
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error?.message}</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}

// Usage
<Interview options={options}>
  <CustomErrorDisplay />
  <Interview.Loading />
  <Interview.Content />
</Interview>
```

## Styling

### With Tailwind CSS

```css
/* app.css */
@import "tailwindcss";
@source "../node_modules/@imminently/interview-ui";
```

This makes Tailwind scan the package for classes to generate.

### Without Tailwind CSS

```tsx
import '@imminently/interview-ui/dist/index.css';
```

### Custom Styling

All components accept `className` prop:

```tsx
<Interview.Form className="space-y-6 max-w-2xl" />
<Interview.Back className="btn btn-secondary" />
<Interview.Next className="btn btn-primary" />
```

## Debugging

### Enable Debug Mode

```tsx
const options = useMemo(() => ({
  debug: true,  // Enables console logging
  // ... other options
}), []);
```

**Debug features**:
- Shift+Click on controls to log their metadata
- Console logs for manager operations
- Can use `<Interview.Debug />` component to see live state

### Common Issues

**Issue**: Interview keeps reinitializing
- **Cause**: Options object not memoized
- **Fix**: Use `useMemo` to memoize options

**Issue**: "Cannot read property of undefined" errors
- **Cause**: Using `useInterview()` outside `<Interview.Root>` context
- **Fix**: Ensure component is child of Interview or Interview.Root

**Issue**: Custom control not showing up
- **Cause**: Wrong slot name or control type mismatch
- **Fix**: Check control type in session data vs slot key

**Issue**: Form validation not working
- **Cause**: Custom control not using FormControl wrapper
- **Fix**: Wrap input in `<FormControl>` component

## Best Practices

1. **Always memoize options** - Prevents unnecessary SessionManager recreations
2. **Use Interview.Content wrapper** - Handles loading/error states automatically
3. **Keep SessionManager external for complex apps** - Use Pattern B for more control
4. **Leverage slots for targeted customization** - Don't rebuild entire form if only one control needs changing
5. **Use asChild prop for button styling** - Keeps functionality while allowing custom markup
6. **Include Interview.Validations** - Don't rely solely on inline errors
7. **Check nextDisabled/backDisabled** - Respect the SDK's navigation state
8. **Use debug mode during development** - Catch issues early

## Type Definitions

### Import Locations

**Core SDK Types** (`@imminently/interview-sdk`):
```tsx
import {
  // Main class
  SessionManager
} from '@imminently/interview-sdk';

import type {
  // Configuration
  ManagerOptions,
  ApiManagerOptions,
  FileManagerOptions,
  AuthData,
  
  // Session & State
  Session,
  SessionSnapshot,
  SessionConfig,
  
  // Screen & Controls
  Screen,
  Control,
  Step,
  
  // Data
  AttributeValues,
  AttributeData,
  
  // Specific control types
  TextControl,
  DateControl,
  BooleanControl,
  SelectControl,
  NumberControl,
  CurrencyControl,
  // ... etc
} from '@imminently/interview-sdk';
```

**UI Layer Types** (`@imminently/interview-ui`):
```tsx
import {
  // Main component
  Interview,
  
  // Hook
  useInterview
} from '@imminently/interview-ui';

import type {
  // Configuration
  InterviewConfig,
  InterviewProviderProps,
  
  // Context
  InterviewContextState,
  InterviewCallbacks,
  
  // Slots
  InterviewSlots,
} from '@imminently/interview-ui';
```

### Key Type Definitions

**SessionSnapshot**:
```tsx
interface SessionSnapshot {
  state: 'loading' | 'error' | 'success';
  session: Session | null;
  error?: Error;
  loading: boolean;          // External operation in progress
  renderAt: number;          // Timestamp of last render
}
```

**Session**:
```tsx
interface Session {
  sessionId: string;
  interactionId?: string;
  model: string;
  status: 'in-progress' | 'complete' | 'error';
  screen: Screen;
  steps: Step[];
  data: AttributeValues;
  progress?: {
    percentage: number;
    canGoBack: boolean;
    canGoForward: boolean;
  };
  complete: boolean;
  error?: string;
}
```

**Screen**:
```tsx
interface Screen {
  id: string;
  title?: string;
  hideTitle?: boolean;
  controls: Control[];
  description?: string;
}
```

**Control** (Base):
```tsx
interface Control {
  id: string;
  type: string;              // 'text', 'date', 'boolean', 'select', etc.
  attribute: string;
  label?: string;
  value?: any;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  caption?: string;
  help?: string;
  version?: number;
  // ... type-specific properties
}
```

**InterviewContextState**:
```tsx
interface InterviewContextState {
  manager: SessionManager;
  session: Session;
  state: 'loading' | 'error' | 'success';
  error?: Error;
  validation: {
    error: boolean;
    warning: boolean;
  };
  isLoading: boolean;
  backDisabled: boolean;
  nextDisabled: boolean;
  callbacks: InterviewCallbacks;
}
```

## File Structure Reference

- `packages/ui/src/interview/Interview.tsx` - Main Interview component
- `packages/ui/src/interview/InterviewContext.tsx` - Context provider logic
- `packages/ui/src/components/RenderControl.tsx` - Control rendering logic
- `packages/ui/src/components/controls/` - Individual control implementations
- `packages/core/src/manager.ts` - SessionManager implementation
- `packages/core/src/types/` - Type definitions

## Summary

The Interview SDK UI provides a flexible component system built on:
- **Core SDK** for business logic and API communication
- **React Context** for state distribution
- **Compositional components** for layout flexibility
- **Slots pattern** for control customization
- **React Hook Form** for form management

Choose your implementation approach based on needs:
- Use default `<Interview>` for quick setup
- Use composition for layout changes
- Use slots for targeted control changes
- Use `useInterview()` for full custom UI

Always remember to memoize the options object and respect the SDK's state management patterns.
