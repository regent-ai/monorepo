# Payment Testing Guide

This guide covers testing x402 payment workflows in Regent agents.

## Unit Testing (Mocked)

The existing test suite includes mocked payment tests that don't require real infrastructure:

### Payment Tracking Tests

Location: `packages/hono/src/__tests__/incoming-payments.test.ts`

```typescript
import { createInMemoryPaymentStorage, createPaymentTracker } from '@regent/x402';

// Create in-memory storage for tests
const storage = createInMemoryPaymentStorage();
const tracker = createPaymentTracker(storage);

// Record test payments
await tracker.recordIncoming(
  'test-group',
  'global',
  'test-route',
  1.5,
  '0xPayerAddress'
);

// Verify tracking
const summary = await tracker.getIncomingSummary({
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
});
```

### Policy Tests

Location: `packages/x402/src/__tests__/policy.test.ts`

```typescript
import { findMostSpecificIncomingLimit } from '@regent/x402';

const limits = {
  global: { maxTotalUsd: 100 },
  perSender: {
    '0x123...': { maxTotalUsd: 50 },
  },
};

const result = findMostSpecificIncomingLimit(limits, payerAddress, domain, url);
```

### Paywall Middleware Tests

Location: `packages/express/src/__tests__/paywall.test.ts`

```typescript
import { withPayments } from '@regent/express';

// Mock app with payment middleware
const app = withPayments(createAgentApp(agent), {
  routes: {
    '/invoke/premium': { price: '0.001' },
  },
});
```

## Integration Testing (Testnet)

For real payment flow testing on testnet:

### Prerequisites

1. **Test wallet with funds**
   ```bash
   # Base Sepolia ETH for gas
   # Base Sepolia USDC for payments
   ```

2. **Environment variables**
   ```bash
   PRIVATE_KEY=0x...          # Test wallet private key
   FACILITATOR_URL=https://...  # x402 facilitator
   CHAIN_ID=84532             # Base Sepolia
   RPC_URL=https://...        # Base Sepolia RPC
   ```

3. **Facilitator access**
   - Register with x402 facilitator service
   - Get API credentials if required

### Test Flow

```typescript
import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { x402 } from '@regent/x402';
import { createAgentWallet } from '@regent/wallet';

// 1. Create agent with payments
const wallet = await createAgentWallet({
  type: 'local-eoa',
  privateKey: process.env.PRIVATE_KEY,
  chainId: 84532,
});

const agent = createAgent({
  name: 'Payment Test Agent',
  version: '1.0.0',
});

agent.use(http());
agent.use(x402({
  payTo: wallet.address,
  facilitatorUrl: process.env.FACILITATOR_URL,
  network: 'base-sepolia',
}));

// 2. Define paid entrypoint
agent.entrypoint('paid-feature', {
  input: z.object({ data: z.string() }),
  output: z.object({ result: z.string() }),
  price: '0.001', // 0.001 USDC
  handler: async ({ input }) => ({
    result: `Processed: ${input.data}`,
  }),
});

// 3. Start server
const runtime = await agent.build();
// Server running on localhost:3000

// 4. Make paid request (from client)
import { createX402Fetch } from 'x402-fetch';

const x402Fetch = createX402Fetch({
  wallet: clientWallet,
  network: 'base-sepolia',
});

const response = await x402Fetch('http://localhost:3000/invoke/paid-feature', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: 'test' }),
});

// 5. Verify payment
const paymentHeader = response.headers.get('X-PAYMENT-RESPONSE');
// Payment was processed
```

### Storage Backend Tests

Test with different storage backends:

```typescript
// In-Memory (default, for tests)
storage: { type: 'in-memory' }

// SQLite
storage: {
  type: 'sqlite',
  config: { filename: ':memory:' } // or file path
}

// PostgreSQL
storage: {
  type: 'postgres',
  config: {
    connectionString: process.env.DATABASE_URL
  }
}
```

## E2E Test Checklist

For complete payment flow verification:

- [ ] Invoice generation (402 response)
- [ ] Payment submission to facilitator
- [ ] Payment verification
- [ ] Settlement confirmation
- [ ] Payment recording in tracker
- [ ] Policy limit enforcement
- [ ] Multiple backend storage
- [ ] Error handling (insufficient funds, expired invoice)

## Mock Facilitator

For local development, you can mock the facilitator:

```typescript
import { Hono } from 'hono';

const mockFacilitator = new Hono();

// Mock invoice endpoint
mockFacilitator.post('/invoice', async (c) => {
  return c.json({
    invoice: 'mock-invoice-123',
    amount: '1000000', // 1 USDC in smallest unit
    expiry: Date.now() + 300000,
  });
});

// Mock payment verification
mockFacilitator.post('/verify', async (c) => {
  return c.json({
    verified: true,
    txHash: '0x...',
  });
});
```

## Running Tests

```bash
# Unit tests (no network required)
bun test

# Integration tests (requires testnet setup)
PAYMENT_TEST=true bun test packages/x402

# Specific payment tests
bun test packages/hono/src/__tests__/incoming-payments.test.ts
```

## Related Resources

- [x402 Protocol](https://x402.org)
- [@regent/x402 Package](../packages/x402/README.md)
- [Payment Tracking API](../packages/x402/src/payment-tracker.ts)
