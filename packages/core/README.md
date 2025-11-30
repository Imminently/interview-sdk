# @imminently/interview-sdk

The core SDK for integrating interview functionality into custom UIs. This package handles all communication with the Decisively API and abstracts the core model and control logic, allowing you to focus on building your view layer.

> **Note:** If you're building a React application, consider using `@imminently/interview-ui` instead, which provides pre-built React components on top of this SDK.

## Key Features

- 🔄 **Session Management** - Create, load, and manage interview sessions with state persistence
- 🌐 **API Abstraction** - Clean interface for all API communications
- 📁 **File Handling** - Built-in file upload/download support
- ⚡ **Dynamic Updates** - Real-time form updates based on user input (client-side and server-side)
- 📘 **TypeScript Support** - Fully typed for better developer experience
- 🔐 **Flexible Authentication** - Support for custom auth configurations

## Installation

```bash
# npm
npm install @imminently/interview-sdk

# yarn
yarn add @imminently/interview-sdk

# pnpm
pnpm add @imminently/interview-sdk

# bun
bun add @imminently/interview-sdk
```

## Core Concepts

### Interview

A form or questionnaire designed to collect information from a user to fulfill a specific goal. Interviews can be built within the Decisively system or auto-generated.

### Session

The stateful interaction between your application and the API. Each session:

- Represents a user's progress through an interview
- Is identified by a unique GUID (`sessionId`)
- Can be persisted and resumed later using the `load()` function
- Contains all the current state, controls, and user data

### Controls

The form elements (inputs, dropdowns, date pickers, etc.) that are dynamically presented to users based on the interview flow and their responses.

## Quick Start

### Creating a SessionManager

The `SessionManager` is your main entry point. Here's how to set it up:

```typescript
import { SessionManager } from '@imminently/interview-sdk';

const manager = new SessionManager({
  // Required: API configuration
  apiManager: {
    host: 'https://api.example.com',
    auth: async () => ({
      // Return your latest auth token
      headers: {
        Authorization: `Bearer ${getLatestToken()}`
      }
    })
  },

  // Required: File management configuration
  fileManager: {
    host: 'https://api.example.com',
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getLatestToken()}`
      }
    })
  },

  // Optional: Enable debug logging
  debug: true,

  // Optional: Initialize with a session
  init: async (manager) => {
    // Option 1: Create a new session
    await manager.create({
      project: 'my-project',
      release: 'v1.0',
      initialData: { /* optional pre-filled data */ }
    });

    // Option 2: Load an existing session
    // await manager.load({
    //   project: 'my-project',
    //   sessionId: 'existing-session-guid',
    //   interactionId: 'existing-interaction-guid'
    // });
  },

  // Optional: Session persistence
  sessionStore: {
    get: () => JSON.parse(localStorage.getItem('interview-session') || '{}'),
    set: (value) => localStorage.setItem('interview-session', JSON.stringify(value))
  },

  // Optional: Read-only mode (no data submission)
  readOnly: false
});
```

### Manager Options Explained

| Option | Type | Description |
|--------|------|-------------|
| `apiManager` | `ApiManager \| ApiManagerOptions` | Configures API communication. See [ApiManager](#apimanager) section. |
| `fileManager` | `FileManager \| FileManagerOptions` | Configures file upload/download. See [FileManager](#filemanager) section. |
| `init` | `(manager) => void \| Promise<void>` | Initialization function called after manager creation. Use this to `create()` or `load()` a session. |
| `debug` | `boolean` | Enables debug logging to console. Default: `false` |
| `preCacheClient` | `boolean` | Pre-loads client-side dynamic runtime for faster interactions. Default: `false` |
| `sessionStore` | `Storage` | Optional storage interface for persisting sessions across page reloads. |
| `readOnly` | `boolean` | Enables read-only mode where no data is submitted to the server. Default: `false` |

### Using the Session

Once initialized, subscribe to session updates and interact with the session:

```typescript
// Subscribe to session state changes
manager.subscribe(() => {
  const snapshot = manager.getSnapshot();
  
  if (snapshot.state === 'success' && snapshot.session) {
    const { screen, status, progress } = snapshot.session;
    
    // Render your UI based on screen.controls
    console.log('Current controls:', screen.controls);
    console.log('Progress:', progress?.percentage);
  }
});

// Submit data for the current screen
await manager.submit({
  attribute_id: 'user input value',
  another_attribute: 42
});

// Navigate forward
await manager.next({
  attribute_id: 'value'
});

// Navigate back
await manager.back();

// Navigate to a specific step
await manager.navigate('step-id');

// Check session state
if (manager.isComplete) {
  console.log('Interview completed!');
}
```

## SessionManager

The `SessionManager` is the heart of the SDK, managing all session operations.

### Creating Sessions

```typescript
// Create a new session
const session = await manager.create({
  project: 'my-project',        // Required: Project ID
  release: 'v1.0',               // Required: Release version
  initialData: {                 // Optional: Pre-fill data
    user_name: 'John Doe',
    user_email: 'john@example.com'
  },
  sessionId: 'custom-guid',      // Optional: Use specific session ID
  responseElements: ['data', 'screen'] // Optional: Customize response
});
```

### Loading Existing Sessions

```typescript
// Resume a previous session
const session = await manager.load({
  project: 'my-project',
  sessionId: 'existing-session-guid',
  interactionId: 'existing-interaction-guid',
  initialData: { /* optional data to merge */ }
});
```

### Navigation Methods

```typescript
// Submit and move to next screen
await manager.next({ attribute: 'value' });

// Go back to previous screen
await manager.back();

// Jump to specific step
await manager.navigate('step-id');

// Submit without navigation
await manager.submit(
  { attribute: 'value' },
  false // navigate = false
);
```

### State Management

```typescript
// Get current snapshot
const snapshot = manager.getSnapshot();
console.log(snapshot.state);      // 'loading' | 'error' | 'success'
console.log(snapshot.session);    // Current session object
console.log(snapshot.loading);    // External operation in progress
console.log(snapshot.renderAt);   // Timestamp of last update

// Access the active session directly
const session = manager.session;
console.log(session.screen);      // Current screen
console.log(session.steps);       // All steps
console.log(session.status);      // 'in-progress' | 'complete' | 'error'

// Utility methods
manager.isComplete;               // Is interview complete?
manager.isLastStep;               // Is this the last step?
manager.canProgress;              // Can user proceed?
```

### Chat Interactions

```typescript
// Send a generative chat message
const response = await manager.chat(
  'complete-profile',              // goal
  'What information do you need?', // message
  'interaction-id'                 // optional existing interaction
);
```

## ApiManager

The `ApiManager` handles all HTTP communication with the Decisively API. You typically configure this through the `SessionManager` options.

### Basic Configuration

```typescript
{
  apiManager: {
    host: 'https://api.example.com',
    path: ['decisionapi', 'session'], // Optional: custom path
    
    // Auth function should return latest token
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getCurrentToken()}`
      }
    }),
    
    // Optional: Axios overrides
    overrides: {
      timeout: 30000,
      headers: { 'X-Custom-Header': 'value' }
    }
  }
}
```

### Custom API Endpoints

You can override default API endpoints using `apiGetters`:

```typescript
{
  apiManager: {
    host: 'https://api.example.com',
    auth: getAuth,
    
    apiGetters: {
      create: (options) => `/custom/create/${options.project}`,
      load: (options) => `/custom/load/${options.project}`,
      submit: (options) => `/custom/submit/${options.session.model}`,
      // ... other endpoints
    }
  }
}
```

### Authentication

The `auth` function is called before each request to get the latest authentication configuration. This ensures your tokens are always fresh:

```typescript
auth: async () => {
  const token = await refreshTokenIfNeeded();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-API-Key': 'your-api-key'
    }
  };
}
```

## FileManager

The `FileManager` handles file uploads and downloads for file-type controls.

### Configuration

```typescript
{
  fileManager: {
    host: 'https://api.example.com',
    filePath: ['decisionapi', 'file'], // Optional: custom path
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
  }
}
```

### Using File Methods

The file methods are accessible through the `SessionManager`:

```typescript
// Upload a file
const result = await manager.uploadFile({
  name: 'document.pdf',
  data: 'data:application/pdf;base64,JVBERi0xLj...' // Data URI
});
// Returns: { reference: 'data:id={uuid};base64,...', id: 'uuid' }

// Download a file
const fileData = await manager.downloadFile('file-reference-id');

// Remove a file
await manager.removeFile('file-reference-id');

// Handle file size errors
manager.onFileTooBig = (file) => {
  console.error(`File ${file.name} is too large`);
};
```

## Advanced Usage

### Sub-Interviews

Sessions can contain nested sub-interviews:

```typescript
// Create a sub-interview from a control
await manager.createSubInterview(interviewControl);

// Check if current session is a sub-interview
if (manager.isSubInterview) {
  console.log('In a sub-interview');
}

// Access the main session vs active session
manager.session;        // Main (root) session
manager.activeSession;  // Currently active session (may be sub-interview)
```

### Debug Mode

Enable debugging to see detailed logs:

```typescript
manager.setDebugEnabled(true);
manager.setAdvancedDebugEnabled(true); // Even more detail
```

### Template Text

Replace placeholders in text with session data:

```typescript
const text = manager.templateText(
  'Hello {{user_name}}, you are {{age}} years old',
  { user_name: 'John', age: 30 }
);
// Result: "Hello John, you are 30 years old"
```

### Explanations

Get explanations for attributes:

```typescript
const explanation = manager.getExplanation('attribute_id');
```

## TypeScript Support

The SDK is fully typed. Key type exports:

```typescript
import type {
  Session,
  Screen,
  Control,
  Step,
  AttributeValues,
  SessionConfig,
  SessionSnapshot,
  ManagerOptions
} from '@imminently/interview-sdk';
```

## Publishing (For Maintainers)

To publish a new version of the SDK package, run the following command from the `packages/core` directory:

```bash
bun install
bun run deploy
```

This will:

1. Build the package
2. Bump the patch version
3. Publish to the GitHub Package Registry

## Related Packages

- **[@imminently/interview-ui](../ui)** - React UI components built on this SDK

## License

See [LICENSE](../../LICENSE) file in the repository root.
