# @regent/analytics

Analytics and reporting for Regent agent payment tracking.

## Installation

```bash
bun add @regent/analytics
```

## Features

- Payment summary generation (incoming/outgoing)
- Transaction history retrieval
- Data export to CSV and JSON formats
- Time-windowed analytics

## Usage

```typescript
import { analytics } from '@regent/analytics';

// Add analytics extension to your agent runtime
const app = createAgent({
  // ... agent config
});

app.use(analytics());
```

### Getting Payment Summaries

```typescript
import {
  getSummary,
  getIncomingSummary,
  getOutgoingSummary,
} from '@regent/analytics';

// Get combined summary for last 24 hours
const summary = await getSummary(runtime, {
  startTime: Date.now() - 24 * 60 * 60 * 1000,
  endTime: Date.now(),
});

// Get incoming payments only
const incoming = await getIncomingSummary(runtime, { /* options */ });

// Get outgoing payments only
const outgoing = await getOutgoingSummary(runtime, { /* options */ });
```

### Exporting Data

```typescript
import { exportToCSV, exportToJSON, getAllTransactions } from '@regent/analytics';

// Get all transactions
const transactions = await getAllTransactions(runtime);

// Export to CSV
const csv = exportToCSV(transactions);

// Export to JSON
const json = exportToJSON(transactions);
```

## API

### Extensions

- `analytics()` - Runtime extension for analytics capabilities

### Functions

- `getSummary(runtime, options)` - Get combined payment summary
- `getIncomingSummary(runtime, options)` - Get incoming payment summary
- `getOutgoingSummary(runtime, options)` - Get outgoing payment summary
- `getAllTransactions(runtime)` - Retrieve all transaction records
- `getAnalyticsData(runtime)` - Get aggregated analytics data
- `exportToCSV(transactions)` - Export transactions to CSV format
- `exportToJSON(transactions)` - Export transactions to JSON format

### Types

- `AnalyticsRuntime` - Runtime with analytics capabilities
- `AnalyticsSummary` - Payment summary data structure
- `Transaction` - Individual transaction record
- `AnalyticsData` - Aggregated analytics data

## License

MIT
