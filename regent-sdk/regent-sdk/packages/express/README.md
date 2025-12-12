# @regent/express

Express.js adapter for Regent agent runtime.

## Installation

```bash
bun add @regent/express express
```

## Features

- Express.js HTTP server integration
- Automatic route generation for agent entrypoints
- x402 payment middleware support
- SSE streaming for real-time responses
- Health checks and manifest endpoints
- Lifecycle hooks (beforeMount, afterMount)

## Quick Start

```typescript
import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { createAgentApp } from '@regent/express';

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

// Create Express app
const app = createAgentApp(agent);

app.listen(3000, () => {
  console.log('Agent running on http://localhost:3000');
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
import { createAgentApp, withPayments } from '@regent/express';
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
  beforeMount: (expressApp) => {
    expressApp.use(cors());
    expressApp.use(morgan('combined'));
  },

  // Hook after routes are mounted
  afterMount: (expressApp) => {
    expressApp.use(errorHandler);
  },
});
```

## API

### Functions

- `createAgentApp(agent, options?)` - Create Express app from agent
- `withPayments(app, config)` - Add x402 payment middleware

### Types

- `CreateAgentAppOptions` - Configuration options
  - `beforeMount?: (app: Express) => void`
  - `afterMount?: (app: Express) => void`

## Requirements

- `@regent/core` - Agent runtime
- `@regent/http` - HTTP extension (must be added to agent)
- `@regent/x402` - Payment extension (optional, for payments)

## License

MIT
