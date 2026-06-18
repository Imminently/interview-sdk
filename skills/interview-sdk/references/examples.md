# Examples

## 1. Minimal setup

The simplest working integration using the default layout:

```tsx
// App.tsx
import { useMemo } from 'react';
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';
import '@imminently/interview-ui/dist/index.css'; // if not using Tailwind

function App() {
  const token = 'your-auth-token';

  const options: ManagerOptions = useMemo(() => ({
    apiManager: {
      host: 'https://api.yourcompany.com', // your backend proxy
      auth: async () => ({
        headers: { Authorization: `Bearer ${token}` }
      })
    },
    init: async (manager) => {
      await manager.create({ project: 'my-project', release: 'v1.0' });
    }
  }), [token]);

  return <Interview options={options} />;
}
```

## 2. Custom layout with composition

Sidebar navigation, custom header, footer nav:

```tsx
// App.tsx
import { useMemo } from 'react';
import { Interview, useInterview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

function InterviewLayout() {
  const { state, session } = useInterview();

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen">
      <aside className="p-6 bg-slate-50 border-r overflow-auto">
        <Interview.Steps />
      </aside>

      <div className="flex flex-col overflow-hidden">
        <Interview.Error />
        <Interview.Loading />

        {state === 'success' && (
          <main className="flex-1 overflow-auto p-8">
            <h1 className="text-2xl font-bold mb-4">{session.screen.title}</h1>
            <Interview.Validations className="mb-6" />
            <Interview.Form className="space-y-6" />
          </main>
        )}

        <footer className="flex justify-between items-center p-4 border-t bg-white">
          <Interview.Back />
          <Interview.Progress />
          <Interview.Next />
        </footer>
      </div>
    </div>
  );
}

function App() {
  const options: ManagerOptions = useMemo(() => ({
    apiManager: {
      host: 'https://api.yourcompany.com',
      auth: async () => ({ headers: { Authorization: 'Bearer token' } })
    },
    init: async (manager) => {
      await manager.create({ project: 'my-project', release: 'v1.0' });
    }
  }), []);

  return (
    <Interview options={options}>
      <InterviewLayout />
    </Interview>
  );
}
```

## 3. External SessionManager with token auth

Create the manager yourself so you can access it outside the tree or initialize before render:

```tsx
// App.tsx
import { useState, useEffect, useMemo } from 'react';
import { SessionManager } from '@imminently/interview-sdk';
import { Interview } from '@imminently/interview-ui';
import type { ManagerOptions } from '@imminently/interview-sdk';

function App() {
  const token = new URLSearchParams(window.location.search).get('token');

  const manager = useMemo(() => {
    if (!token) return null;

    const options: ManagerOptions = {
      apiManager: {
        host: 'https://api.yourcompany.com',
        auth: () => ({ token: `Bearer ${token}`, tenancy: 'your-tenancy-id' })
      },
      init: async (mgr) => {
        await mgr.create({ project: 'my-project', release: 'v1.0' });
      }
    };

    return new SessionManager(options);
  }, [token]);

  if (!token) {
    return <div>No token provided</div>;
  }

  if (!manager) return null;

  return (
    <Interview.Root manager={manager}>
      <Interview.Error />
      <Interview.Loading />
      <Interview.Content />
    </Interview.Root>
  );
}
```

## 4. Headless (no UI components)

Use the SDK directly without any React UI — for Node.js, testing, or non-React environments:

```typescript
// headless.ts
import { SessionManager } from '@imminently/interview-sdk';
import type { ManagerOptions } from '@imminently/interview-sdk';

async function run() {
  const manager = new SessionManager({
    apiManager: {
      host: 'https://api.yourcompany.com',
      auth: async () => ({ headers: { Authorization: 'Bearer token' } })
    }
  });

  manager.subscribe(() => {
    const { state, session } = manager.getSnapshot();
    if (state === 'success' && session) {
      console.log('Screen:', session.screen.title);
      console.log('Controls:', session.screen.controls);
    }
  });

  await manager.create({ project: 'my-project', release: 'v1.0' });

  await manager.next({ name: 'John Doe', age: 30 });
  await manager.next({ email: 'john@example.com' });

  if (manager.isComplete) {
    console.log('Done. Final data:', manager.session.data);
  }
}

run();
```

## 5. Custom controls with slots

Replace specific control types while keeping the rest default:

```tsx
// CustomTextInput.tsx
import { FormControl, FormLabel, FormMessage, FormDescription } from '@imminently/interview-ui';

export const CustomTextInput = ({ field }: any) => (
  <>
    <FormLabel>{field.control.label}</FormLabel>
    <FormControl>
      <input
        type="text"
        value={field.value ?? ''}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
        placeholder={field.control.caption}
        className="w-full px-4 py-2 border rounded-lg"
      />
    </FormControl>
    <FormDescription />
    <FormMessage />
  </>
);

// App.tsx
import { Interview } from '@imminently/interview-ui';
import { CustomTextInput } from './CustomTextInput';

function App() {
  return (
    <Interview
      options={options}
      slots={{
        text: CustomTextInput,
        // add more overrides as needed
      }}
    />
  );
}
```

## 6. Backend proxy (Express)

The recommended production pattern — keep Decisively credentials server-side only:

```typescript
// backend-proxy.ts
import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const DECISIVELY_API = 'https://api.decisively.io';
const DECISIVELY_TOKEN = process.env.DECISIVELY_API_KEY; // never exposed to client

const proxyEndpoint = (path: string) => async (req: any, res: any) => {
  // validate your app's user token
  const userToken = req.headers.authorization;
  if (!isValidUserToken(userToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await axios({
      method: req.method,
      url: `${DECISIVELY_API}${path}`,
      data: req.body,
      headers: {
        Authorization: `Bearer ${DECISIVELY_TOKEN}`,
        'X-Tenancy': 'your-tenancy-id'
      }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status ?? 500).json({ error: 'Proxy error' });
  }
};

app.post('/decisionapi/session/create', proxyEndpoint('/decisionapi/session/create'));
app.post('/decisionapi/session/submit', proxyEndpoint('/decisionapi/session/submit'));
// ... other endpoints as needed

app.listen(3001);
```

```tsx
// Frontend — points at your proxy, not Decisively directly
const options: ManagerOptions = useMemo(() => ({
  apiManager: {
    host: 'https://api.yourcompany.com',
    auth: async () => ({
      headers: { Authorization: `Bearer ${userToken}` }
    })
  },
  init: async (manager) => {
    await manager.create({ project: 'my-project', release: 'v1.0' });
  }
}), [userToken]);
```

## 7. Lifecycle hooks for analytics

```tsx
import {
  Interview,
  useInterviewComplete,
  useInterviewSessionUpdate,
  useInterviewError,
} from '@imminently/interview-ui';

function AnalyticsObserver() {
  useInterviewComplete(({ session }) => {
    analytics.track('interview_complete', { sessionId: session.sessionId });
  });

  useInterviewSessionUpdate(({ session, source }) => {
    analytics.track('interview_screen_view', {
      screen: session.screen.id,
      source,
    });
  });

  useInterviewError(({ error, source }) => {
    errorReporter.capture(error, { source });
  });

  return null;
}

function App() {
  return (
    <Interview options={options}>
      <AnalyticsObserver />
      <Interview.Content />
    </Interview>
  );
}
```
