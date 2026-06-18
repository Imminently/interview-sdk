# SessionManager

The `SessionManager` is the core of the SDK — it manages all session operations, API communication, and state.

```typescript
import { SessionManager } from '@imminently/interview-sdk';
import type { ManagerOptions } from '@imminently/interview-sdk';
```

## Creating a SessionManager

```typescript
const manager = new SessionManager({
  apiManager: {
    host: 'https://api.decisively.io', // or your backend proxy (recommended)
    auth: async () => ({
      headers: {
        Authorization: `Bearer ${getLatestToken()}`
      }
    })
  },

  fileManager: {                       // required if using file upload controls
    host: 'https://api.decisively.io',
    auth: async () => ({
      headers: { Authorization: `Bearer ${getLatestToken()}` }
    })
  },

  init: async (manager) => {
    await manager.create({ project: 'my-project', release: 'v1.0' });
    // or: await manager.load({ project: 'my-project', sessionId: '...', interactionId: '...' });
  },

  debug: false,           // enables debug infrastructure; toggle at runtime with setDebugEnabled()
  preCacheClient: true,   // pre-loads client-side rules engine for faster interactions
  readOnly: false,        // disables data submission when true
});
```

See [configuration.md](./configuration.md) for the full `ManagerOptions` type reference.

## Session lifecycle

### Create

```typescript
const session = await manager.create({
  project: 'my-project',       // project name or GUID in Decisively
  release: 'v1.0',             // optional: specific release
  initialData: { attr: 'val'}, // optional: pre-fill attribute values
  sessionId: 'custom-guid',    // optional: use a specific session ID
  response: ['data', 'screen'] // optional: control response shape; reused on subsequent calls
});
```

### Load

```typescript
const session = await manager.load({
  project: 'my-project',
  sessionId: 'existing-session-guid',
  interactionId: 'existing-interaction-guid',
  initialData: { /* optional */ }
});
```

### Reset

```typescript
// Restart using the same create/load config
await manager.reset();

// Or pass an explicit override config
await manager.reset({ project: 'my-project', release: 'v1.0' });
```

## Navigation

```typescript
// Submit current screen data and advance to the next screen
await manager.next({ attribute_id: 'value', another: 42 });

// Override the response shape for a single call
await manager.next({ attribute_id: 'value' }, { response: ['data', 'screen', 'explanations'] });

// Go back to the previous screen
await manager.back();

// Jump to a specific step by ID
await manager.navigate('step-id');

// Submit without navigating (navigate = false)
await manager.submit({ attribute_id: 'value' }, false);
```

## State

```typescript
const snapshot = manager.getSnapshot();
snapshot.state;    // 'loading' | 'error' | 'success'
snapshot.session;  // Session | null
snapshot.loading;  // boolean — external operation in progress
snapshot.renderAt; // number — timestamp of last update

// Shorthand accessors
manager.session;       // current Session object
manager.isComplete;    // interview finished?
manager.isLastStep;    // on the last step?
manager.canProgress;   // can the user proceed?
manager.activeSession; // active session (may be a sub-interview)
manager.isSubInterview;
```

> **In React**: do not call `manager.subscribe()` directly. Use `useInterview()` from `@imminently/interview-ui` — it uses `useSyncExternalStore` internally.

## Lifecycle events

### Via `ManagerOptions.lifecycle`

```typescript
const manager = new SessionManager({
  // ...
  lifecycle: {
    onCreate: ({ session }) => console.log('created', session.sessionId),
    onSessionUpdate: ({ session, source }) => console.log('updated from', source),
    onComplete: ({ session }) => console.log('complete', session.sessionId),
    onError: ({ error, source }) => console.error('error from', source, error),
  },
});
```

### Via `manager.events`

```typescript
const unsubscribe = manager.events.subscribe('complete', ({ session }) => {
  analytics.track('interview_complete', { sessionId: session.sessionId });
});

const unsubscribeUpdate = manager.events.onSessionUpdate(({ session, source }) => {
  console.log(source, session.status);
});
```

Available event names: `sessionStart`, `create`, `load`, `reset`, `sessionUpdate`, `complete`, `error`, `activeSessionChange`

## File operations

```typescript
// Upload — accepts a data URI
const result = await manager.uploadFile({
  name: 'document.pdf',
  data: 'data:application/pdf;base64,JVBERi0xLj...'
});
// Returns: { reference: 'data:id={uuid};base64,...', id: 'uuid' }

// Download
const fileData = await manager.downloadFile('file-reference-id');

// Remove
await manager.removeFile('file-reference-id');

// Handle oversized files
manager.onFileTooBig = (file) => console.error(`${file.name} is too large`);
```

## Timeline export

```typescript
const timeline = await manager.exportTimeline(); // raw payload

await manager.downloadTimeline();                // browser download, default filename
await manager.downloadTimeline('My Export.json');
```

## Advanced

### Sub-interviews

```typescript
await manager.createSubInterview(interviewControl);
manager.isSubInterview; // true when inside a sub-interview
manager.session;        // root session
manager.activeSession;  // currently active (may be sub-interview)
```

### Template text

```typescript
const text = manager.templateText('Hello {{name}}, age {{age}}', { name: 'John', age: 30 });
// → "Hello John, age 30"
```

### Explanations

```typescript
const explanation = manager.getExplanation('attribute_id');
```

### Debug

```typescript
manager.setDebugEnabled(true);
manager.setAdvancedDebugEnabled(true);
```

### Chat (experimental)

```typescript
const response = await manager.chat(
  'complete-profile',       // goal
  'What info do you need?', // message
  'interaction-id'          // optional existing interaction
);
```

## Session object shape

```typescript
interface Session {
  sessionId: string;
  interactionId?: string;
  model: string;
  status: 'in-progress' | 'complete' | 'error';
  screen: Screen;
  steps: Step[];
  data: AttributeValues;
  progress?: { percentage: number; canGoBack: boolean; canGoForward: boolean };
  complete: boolean;
  error?: string;
}

interface Screen {
  id: string;
  title?: string;
  hideTitle?: boolean;
  controls: Control[];
  description?: string;
}

interface Control {
  id: string;
  type: string;       // 'text' | 'date' | 'boolean' | 'select' | 'number' | 'currency' | ...
  attribute: string;
  label?: string;
  value?: any;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  caption?: string;
  help?: string;
}
```
