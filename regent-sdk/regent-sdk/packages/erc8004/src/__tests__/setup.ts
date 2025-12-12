/**
 * Bun test setup file for ERC-8004 SDK tests.
 * Configures logging and test environment.
 */

import { beforeAll, afterAll } from 'bun:test';

// Global test setup (runs before all tests)
beforeAll(async () => {
  // Verify environment variables are set
  if (!process.env.AGENT_PRIVATE_KEY && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  AGENT_PRIVATE_KEY not set. Some tests may fail.');
  }
  if (!process.env.PINATA_JWT && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  PINATA_JWT not set. IPFS tests may fail.');
  }
});

// Global test teardown (runs after all tests)
afterAll(async () => {
  // Cleanup if needed
});
