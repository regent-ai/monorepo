import { definePackageConfig } from '../tsup.config.base';

export default definePackageConfig({
  entry: ['src/index.ts'],
  dts: true,
  external: [
    '@regent/core',
    '@regent/erc8004',
    '@regent/wallet',
    'x402-fetch',
    'x402',
    'viem',
    'zod',
  ],
});

