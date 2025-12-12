import { definePackageConfig } from '../tsup.config.base';

export default definePackageConfig({
  entry: ['src/index.ts'],
  external: [
    '@regent/core',
    '@regent/http',
    '@regent/hono',
    '@regent/wallet',
    '@regent/x402',
    '@regent/a2a',
    '@regent/erc8004',
    '@regent/types',
    'viem',
    'hono',
  ],
});
