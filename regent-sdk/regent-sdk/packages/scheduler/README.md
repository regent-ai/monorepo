# @regent/scheduler

Pull-style scheduler for hiring agents via their `agent-card.json`, binding a wallet for payment, and invoking entrypoints on a schedule.

## Usage

```ts
import {
  createMemoryStore,
  createSchedulerRuntime,
  createSchedulerWorker,
} from '@regent/scheduler';

const runtime = createSchedulerRuntime({
  store: createMemoryStore(),
  invoke: async ({ manifest, entrypointKey, input, wallet }) => {
    // Bridge into your agent runtime: resolve entrypoint and charge via the bound wallet.
    console.log(`Invoke ${entrypointKey} on ${manifest.name} using ${wallet.address}`, input);
  },
});

const { hire } = await runtime.createHire({
  agentCardUrl: 'https://agent.example.com',
  wallet: { walletId: 'w1', network: 'base', address: '0xabc' },
  entrypointKey: 'daily-report',
  schedule: { kind: 'interval', everyMs: 86_400_000 },
  jobInput: { userId: 'u1' },
});

await runtime.addJob({
  hireId: hire.id,
  entrypointKey: 'hourly-sync',
  schedule: { kind: 'once', at: Date.now() + 30_000 },
  jobInput: { accountId: 'acct-123' },
});

const worker = createSchedulerWorker(runtime, 5_000);
worker.start();
```

## Schedule Types

### Interval

Run at fixed intervals:

```ts
{ kind: 'interval', everyMs: 3600_000 } // Every hour
```

### Once

Run once at a specific time:

```ts
{ kind: 'once', at: Date.now() + 30_000 } // 30 seconds from now
```

### Cron

Run on a cron schedule with optional timezone support:

```ts
// Every day at midnight UTC
{ kind: 'cron', expression: '0 0 * * *' }

// Every Monday at 9am New York time
{ kind: 'cron', expression: '0 9 * * 1', timezone: 'America/New_York' }

// Every 15 minutes
{ kind: 'cron', expression: '*/15 * * * *' }

// First day of every month at noon
{ kind: 'cron', expression: '0 12 1 * *' }
```

#### Cron Expression Format

Standard 5-field cron format:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * *
```

Supports:
- `*` - any value
- `,` - value list (e.g., `1,3,5`)
- `-` - range (e.g., `1-5`)
- `/` - step (e.g., `*/15` for every 15)

## Notes

- Agent discovery uses `.well-known/agent-card.json` (with fallbacks) and caches the card per hire.
- Wallet bindings ride along each invocation so payments/x402 can charge that wallet.
