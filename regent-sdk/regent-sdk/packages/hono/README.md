# @regent/hono

Hono.js adapter for Regent agent runtime.

## Installation

```bash
bun add @regent/hono hono
```

## Features

- Lightweight Hono.js HTTP server integration
- Edge/serverless deployment ready
- Automatic route generation for agent entrypoints
- x402 payment middleware support
- SSE streaming for real-time responses
- Health checks and manifest endpoints
- Lifecycle hooks (beforeMount, afterMount)

## Quick Start

```typescript
import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { createAgentApp } from '@regent/hono';
import { serve } from 'bun';

// Create agent with HTTP extension
const agent = createAgent({
  name: 'My Agent',
  version: '1.0.0',
});

agent.use(http());

// Define entrypoints
agent.entrypoint('greet', {
  input: z.object({ name: z.string() }),
  output: z.object({ message: z.string() }),
  handler: async ({ input }) => ({
    message: `Hello, ${input.name}!`,
  }),
});

// Create Hono app
const app = createAgentApp(agent);

// Serve with Bun
serve({
  fetch: app.fetch,
  port: 3000,
});
```

## Routes

The adapter automatically creates these routes:

| Route | Method | Description |
|-------|--------|-------------|
| `/` | GET | Landing page |
| `/health` | GET | Health check |
| `/manifest` | GET | Agent manifest |
| `/entrypoints` | GET | List entrypoints |
| `/invoke/:name` | POST | Invoke entrypoint |
| `/stream/:name` | POST | Stream entrypoint (SSE) |

## With Payments

```typescript
import { createAgentApp, withPayments } from '@regent/hono';
import { x402 } from '@regent/x402';

// Add x402 payment extension
agent.use(x402({
  network: 'base-sepolia',
  wallet: agentWallet,
}));

// Create app with payment middleware
const app = withPayments(createAgentApp(agent), {
  routes: {
    '/invoke/premium': { price: '0.001' },
  },
});
```

## Configuration

```typescript
const app = createAgentApp(agent, {
  // Hook before routes are mounted
  beforeMount: (honoApp) => {
    honoApp.use('*', cors());
    honoApp.use('*', logger());
  },

  // Hook after routes are mounted
  afterMount: (honoApp) => {
    honoApp.onError(errorHandler);
  },
});
```

## Edge Deployment

Hono works great with edge runtimes:

```typescript
// Cloudflare Workers
export default {
  fetch: app.fetch,
};

// Vercel Edge
export const config = { runtime: 'edge' };
export default app.fetch;

// Deno Deploy
Deno.serve(app.fetch);
```

## API

### Functions

- `createAgentApp(agent, options?)` - Create Hono app from agent
- `withPayments(app, config)` - Add x402 payment middleware

### Types

- `CreateAgentAppOptions` - Configuration options
  - `beforeMount?: (app: Hono) => void`
  - `afterMount?: (app: Hono) => void`

## Requirements

- `@regent/core` - Agent runtime
- `@regent/http` - HTTP extension (must be added to agent)
- `@regent/x402` - Payment extension (optional, for payments)

## Why Hono?

- Ultra-lightweight (~14KB)
- Works on any JavaScript runtime
- TypeScript-first design
- Fast routing with Trie-based router
- Built-in middleware ecosystem

## License

MIT
