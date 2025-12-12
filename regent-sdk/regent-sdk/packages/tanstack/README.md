# @regent/tanstack

TanStack Start adapter for Regent agent runtime.

## Installation

```bash
bun add @regent/tanstack @tanstack/react-start
```

## Features

- TanStack Start (full-stack React) integration
- Server-side RPC endpoints
- x402 payment middleware
- SSE streaming support
- Type-safe API routes

## Quick Start

```typescript
// app/routes/api/agent.ts
import { createTanStackRuntime, createTanStackHandlers } from '@regent/tanstack';
import { createAgent } from '@regent/core';
import { http } from '@regent/http';

// Create agent
const agent = createAgent({
  name: 'My Agent',
  version: '1.0.0',
});

agent.use(http());

agent.entrypoint('greet', {
  input: z.object({ name: z.string() }),
  output: z.object({ message: z.string() }),
  handler: async ({ input }) => ({
    message: `Hello, ${input.name}!`,
  }),
});

// Initialize runtime
const runtime = createTanStackRuntime(agent);

// Create handlers
const handlers = createTanStackHandlers(runtime);

// Export route handlers
export const GET = handlers.get;
export const POST = handlers.post;
```

## Routes

The adapter provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/health` | GET | Health check |
| `/api/agent/manifest` | GET | Agent manifest |
| `/api/agent/entrypoints` | GET | List entrypoints |
| `/api/agent/invoke/:name` | POST | Invoke entrypoint |
| `/api/agent/stream/:name` | POST | Stream entrypoint (SSE) |
| `/api/agent/tasks` | GET/POST | Task management |

## With Payments

```typescript
import {
  createTanStackRuntime,
  createTanStackHandlers,
  createTanStackPaywall,
  paymentMiddleware
} from '@regent/tanstack';
import { x402 } from '@regent/x402';

// Add payment extension
agent.use(x402({
  network: 'base-sepolia',
  wallet: agentWallet,
}));

const runtime = createTanStackRuntime(agent);

// Create paywall configuration
const paywall = createTanStackPaywall({
  routes: {
    '/api/agent/invoke/premium': {
      price: '0.001',
      currency: 'USDC',
    },
  },
});

// Apply payment middleware
const handlers = createTanStackHandlers(runtime, {
  middleware: [paymentMiddleware(paywall)],
});
```

## Route-Level Payments

```typescript
// app/routes/api/premium.ts
import { paymentMiddleware, createTanStackPaywall } from '@regent/tanstack';

const paywall = createTanStackPaywall({
  routes: {
    '/api/premium': { price: '0.01' },
  },
});

export const POST = paymentMiddleware(paywall)(async (ctx) => {
  // Handler runs after payment verification
  return { result: 'Premium content' };
});
```

## API

### Functions

- `createTanStackRuntime(agent)` - Initialize agent runtime for TanStack
- `createTanStackHandlers(runtime, options?)` - Create request handlers
- `createTanStackPaywall(config)` - Set up payment configuration
- `paymentMiddleware(paywall)` - Route-level payment enforcement

### Types

- `TanStackRuntime` - Runtime instance
- `TanStackHandlers` - Handler collection
- `TanStackPaywall` - Payment configuration
- `RouteConfig` - Per-route payment settings

## Directory Structure

```
app/
├── routes/
│   └── api/
│       └── agent/
│           ├── index.ts       # Main handlers
│           ├── health.ts      # Health endpoint
│           ├── invoke/
│           │   └── $name.ts   # Dynamic invoke routes
│           └── stream/
│               └── $name.ts   # Dynamic stream routes
```

## Requirements

- `@regent/core` - Agent runtime
- `@regent/http` - HTTP extension
- `@regent/x402` - Payment extension (optional)
- `@tanstack/react-start` - TanStack Start framework

## License

MIT
