# @regent/http

HTTP extension for Regent agent runtime.

## Installation

```bash
bun add @regent/http
```

## Features

- Core HTTP request/response handlers
- Server-Sent Events (SSE) streaming
- Request validation with Zod
- Framework-agnostic design
- Used by Express, Hono, and TanStack adapters

## Usage

The HTTP extension must be added to your agent before using any HTTP adapter:

```typescript
import { createAgent } from '@regent/core';
import { http } from '@regent/http';

const agent = createAgent({
  name: 'My Agent',
  version: '1.0.0',
});

// Add HTTP extension
agent.use(http());

// Now you can use Express, Hono, or TanStack adapters
```

## Configuration

```typescript
agent.use(http({
  // Custom options (if any)
}));
```

## SSE Streaming

The package provides utilities for Server-Sent Events:

```typescript
import { createSSEStream, writeSSE } from '@regent/http';

// Create SSE stream
const stream = createSSEStream();

// Write events to stream
writeSSE(stream, {
  event: 'message',
  data: { content: 'Hello!' },
});

// Close stream
stream.close();
```

## Request Handling

```typescript
import { invokeHandler } from '@regent/http';

// Process an invocation request
const response = await invokeHandler(runtime, {
  name: 'greet',
  input: { name: 'World' },
});
```

## API

### Extensions

- `http(options?)` - Add HTTP capabilities to agent runtime

### Functions

- `invokeHandler(runtime, request)` - Process single invocation
- `createSSEStream()` - Create new SSE stream
- `writeSSE(stream, event)` - Write event to SSE stream

### Types

- `HttpExtensionOptions` - Extension configuration
- `AgentHttpHandlers` - HTTP handler interfaces
- `SSEStreamRunner` - SSE stream controller

## Architecture

```
@regent/http (this package)
    │
    ├── @regent/express (Express adapter)
    ├── @regent/hono (Hono adapter)
    └── @regent/tanstack (TanStack adapter)
```

The HTTP extension provides the core functionality that framework-specific adapters build upon.

## Requirements

- `@regent/core` - Agent runtime
- `zod` - Schema validation (peer dependency)

## License

MIT
