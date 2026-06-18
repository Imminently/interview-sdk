# Configuration Reference

## ManagerOptions

Full type definition for the `SessionManager` constructor and the `options` prop on `<Interview>`.

```typescript
import type { ManagerOptions } from '@imminently/interview-sdk';

interface ManagerOptions {
  apiManager: ApiManager | ApiManagerOptions;   // required
  fileManager?: FileManager | FileManagerOptions;
  init?: (manager: SessionManager) => void | Promise<void>;
  debug?: boolean;
  preCacheClient?: boolean;
  sessionStore?: Storage;
  readOnly?: boolean;
  lifecycle?: ManagerLifecycleOptions;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiManager` | `ApiManagerOptions` | — | **Required.** API communication config |
| `fileManager` | `FileManagerOptions` | — | File upload/download config; required for file controls |
| `init` | `(manager) => void \| Promise<void>` | — | Called after manager creation; use to `create()` or `load()` |
| `debug` | `boolean` | `false` | Enables debug infrastructure; starts disabled, toggle at runtime |
| `preCacheClient` | `boolean` | `false` | Pre-loads client-side rules engine for faster interactions |
| `sessionStore` | `Storage` | — | Persist session across page reloads |
| `readOnly` | `boolean` | `false` | Disables all data submission |
| `lifecycle` | `ManagerLifecycleOptions` | — | Side-effect hooks for session events |

## ApiManagerOptions

```typescript
interface ApiManagerOptions {
  host: string;                          // API base URL (your proxy or https://api.decisively.io)
  path?: string[];                       // default: ['decisionapi', 'session']
  auth: () => Promise<AuthData> | AuthData;
  overrides?: AxiosRequestConfig;
  apiGetters?: {
    create?: (options) => string;
    load?: (options) => string;
    submit?: (options) => string;
    navigate?: (options) => string;
    getRulesEngine?: (options) => string;
    getConnectedData?: () => string;
    simulate?: (options) => string;
  };
}

interface AuthData {
  headers?: Record<string, string>;
  token?: string;      // auto-added as Authorization header
  tenancy?: string;    // auto-added as X-Tenancy header
}
```

The `auth` function is called before **each** request — always return the latest token.

```typescript
auth: async () => {
  const token = await refreshTokenIfNeeded();
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
}
```

## FileManagerOptions

```typescript
interface FileManagerOptions {
  host: string;
  filePath?: string[];                   // default: ['decisionapi', 'file']
  auth?: () => Promise<AuthData> | AuthData;
}
```

## ManagerLifecycleOptions

```typescript
interface ManagerLifecycleOptions {
  onCreate?: (payload: { session: Session }) => void;
  onLoad?: (payload: { session: Session }) => void;
  onReset?: (payload: { session: Session }) => void;
  onSessionUpdate?: (payload: { session: Session; source: string }) => void;
  onComplete?: (payload: { session: Session }) => void;
  onError?: (payload: { error: Error; source: string }) => void;
  onActiveSessionChange?: (payload: { session: Session }) => void;
}
```

## InterviewConfig (UI layer)

Props accepted by `<Interview>` (excluding `options` and `children`):

```typescript
interface InterviewConfig {
  form?: {
    mode?: 'onBlur' | 'onChange' | 'onSubmit';
    reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
    shouldFocusError?: boolean;
  };

  slots?: {
    text?: React.FC<any>;
    textarea?: React.FC<any>;
    number?: React.FC<any>;
    currency?: React.FC<any>;
    boolean?: React.FC<any>;
    date?: React.FC<any>;
    datetime?: React.FC<any>;
    time?: React.FC<any>;
    select?: React.FC<any>;
    radio?: React.FC<any>;
    file?: React.FC<any>;
    image?: React.FC<any>;
    document?: React.FC<any>;
    typography?: React.FC<any>;
    explanation?: React.FC<any>;
    renderValue?: React.FC<any>;
    [key: string]: React.FC<any> | undefined;
  };

  icons?: Record<string, React.ComponentType<{ className?: string }>>;
  inlineErrors?: boolean;    // default: false — show errors on controls vs centralised
  readOnly?: boolean;
  callbacks?: {
    onDebugControlClick?: (control: Control, context: InterviewContextState) => void;
  };

  // NOTE: theme is defined but unused in the current version
  theme?: Record<string, any>;
}
```

## Complete ManagerOptions example

```typescript
const options: ManagerOptions = {
  apiManager: {
    host: 'https://api.yourcompany.com', // backend proxy

    auth: async () => {
      const token = await getLatestToken();
      return {
        headers: { Authorization: `Bearer ${token}` },
        // shorthand alternatives:
        // token: token,         // auto-adds Authorization header
        // tenancy: 'tenant-id'  // auto-adds X-Tenancy header
      };
    },

    path: ['decisionapi', 'session'],    // only override if your proxy differs

    overrides: {
      timeout: 30000,
      headers: { 'X-Custom': 'value' }
    },

    apiGetters: {                        // only override specific endpoints as needed
      create: (opts) => `/custom/create/${opts.project}`,
      load: (opts) => `/custom/load/${opts.project}`,
    }
  },

  fileManager: {
    host: 'https://api.yourcompany.com',
    filePath: ['decisionapi', 'file'],
    auth: async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } })
  },

  init: async (manager) => {
    await manager.create({
      project: 'my-project',
      release: 'v1.0',
      initialData: { user_name: 'Jane' }
    });
  },

  debug: true,
  preCacheClient: true,

  sessionStore: {
    get: () => JSON.parse(localStorage.getItem('session') || '{}'),
    set: (value) => localStorage.setItem('session', JSON.stringify(value))
  },

  lifecycle: {
    onComplete: ({ session }) => console.log('done', session.sessionId),
    onError: ({ error }) => reportError(error),
  },

  readOnly: false,
};
```

## Key TypeScript imports

```typescript
// Core SDK
import { SessionManager } from '@imminently/interview-sdk';
import type {
  ManagerOptions,
  ApiManagerOptions,
  FileManagerOptions,
  AuthData,
  Session,
  SessionSnapshot,
  SessionConfig,
  Screen,
  Control,
  Step,
  AttributeValues,
  AttributeData,
  TextControl,
  DateControl,
  BooleanControl,
  SelectControl,
  NumberControl,
  CurrencyControl,
} from '@imminently/interview-sdk';

// UI layer
import { Interview, useInterview } from '@imminently/interview-ui';
import type {
  InterviewConfig,
  InterviewContextState,
  InterviewProviderProps,
  InterviewCallbacks,
  InterviewSlots,
} from '@imminently/interview-ui';
```

## SessionSnapshot

```typescript
interface SessionSnapshot {
  state: 'loading' | 'error' | 'success';
  session: Session | null;
  error?: Error;
  loading: boolean;    // external operation in progress
  renderAt: number;    // timestamp of last update
}
```
