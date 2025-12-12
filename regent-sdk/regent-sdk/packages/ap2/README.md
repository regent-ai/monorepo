# @regent/ap2

AP2 (Agent Payments Protocol) extension for Regent agents. Adds AP2 extension metadata to Agent Cards, enabling agents to declare payment-related capabilities and roles.

## What is AP2?

AP2 (Agent Payments Protocol) is an extension to the A2A Protocol that enables agents to declare payment-related capabilities. Agents can declare roles such as `merchant` (accepts payments) or `shopper` (makes payments), allowing other agents to discover payment-enabled capabilities.

## Installation

```bash
bun add @regent/ap2
```

## Quick Start

### Basic Usage

```typescript
import { createAgentCardWithAP2, createAP2Runtime } from '@regent/ap2';
import { buildAgentCard } from '@regent/a2a';

// Build base Agent Card
let card = buildAgentCard({
  meta: { name: 'my-agent', version: '1.0.0' },
  registry: entrypoints,
  origin: 'https://my-agent.example.com',
});

// Add AP2 extension
card = createAgentCardWithAP2(card, {
  roles: ['merchant'],
  description: 'Accepts payments for services',
});

// Create AP2 runtime
const ap2Runtime = createAP2Runtime({
  roles: ['merchant'],
});
```

### Integration with Agent Runtime

```typescript
import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { payments } from '@regent/x402';
import { ap2 } from '@regent/ap2';
import { createAgentApp } from '@regent/hono';

// AP2 must be explicitly configured - no auto-detection
const agent = await createAgent({
  name: 'my-agent',
  version: '1.0.0',
})
  .use(http())
  .use(payments({
    config: {
      payTo: process.env.PAYMENTS_RECEIVABLE_ADDRESS!,
      network: 'base-sepolia',
      facilitatorUrl: 'https://facilitator.example.com',
    },
  }))
  .use(ap2({ roles: ['merchant'] })) // Explicitly add AP2 extension
  .build();

const { app } = createAgentApp(runtime);

// AP2 runtime is available via runtime.ap2
if (runtime.ap2) {
  console.log('AP2 roles:', runtime.ap2.config.roles);
}
```

## API Reference

### `createAP2Runtime(config?)`

Creates an AP2 runtime from configuration. Returns `undefined` if no config provided.

```typescript
import { createAP2Runtime } from '@regent/ap2';

const ap2Runtime = createAP2Runtime({
  roles: ['merchant', 'shopper'],
  description: 'Payment-enabled agent',
  required: true,
});
```

### `createAgentCardWithAP2(card, ap2Config)`

Adds AP2 extension metadata to an Agent Card. Returns a new card (immutable).

```typescript
import { createAgentCardWithAP2 } from '@regent/ap2';

const enhancedCard = createAgentCardWithAP2(card, {
  roles: ['merchant'],
  description: 'Accepts payments',
});
```

### `AP2_EXTENSION_URI`

The canonical URI for the AP2 extension.

```typescript
import { AP2_EXTENSION_URI } from '@regent/ap2';

console.log(AP2_EXTENSION_URI); // 'https://ap2.regent.cx'
```

## AP2 Roles

- **`merchant`**: Agent accepts payments for its services
- **`shopper`**: Agent makes payments to other agents
- **`credentials-provider`**: Agent provides payment credentials
- **`payment-processor`**: Agent processes payments

An agent can have multiple roles (e.g., both `merchant` and `shopper`).

## Payments vs AP2

**Payments extension** (`@regent/x402`) and **AP2 extension** (`@regent/ap2`) are independent:

- **Payments extension** - Handles actual payment processing via x402 protocol
- **AP2 extension** - Advertises payment roles in the manifest for discovery

**To receive payments:** Use the `payments()` extension.

**To participate in AP2 ecosystem:** Explicitly add the `ap2()` extension with appropriate roles (e.g., `merchant` for accepting payments).

**Common pattern:** If you're accepting payments and want to be discoverable in the AP2 ecosystem, use both:
```typescript
.use(payments({ config: {...} }))  // Enable payment processing
.use(ap2({ roles: ['merchant'] }))  // Advertise merchant role
```

## Related Packages

- `@regent/a2a` - A2A Protocol implementation (Agent Cards)
- `@regent/x402` - x402 payment protocol utilities
- `@regent/core` - Core agent runtime

## Resources

- [A2A Protocol Specification](https://a2a-protocol.org/) - Agent-to-Agent communication protocol
- [AP2 Extension Documentation](https://ap2.regent.cx) - AP2 extension details

