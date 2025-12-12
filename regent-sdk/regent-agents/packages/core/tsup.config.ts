import { definePackageConfig } from '../tsup.config.base';

const entryPoints = {
  index: 'src/index.ts',
  utils: 'src/utils/index.ts',
  'axllm/index': 'src/axllm/index.ts',
};

export default definePackageConfig({
  entry: entryPoints,
  dts: {
    entry: entryPoints,
  },
  external: [
    '@ax-llm/ax',
    '@regent/types',
    '@regent/a2a',
    '@regent/ap2',
    '@regent/identity',
    '@regent/payments',
    'hono',
    'viem',
    'x402',
    'x402-fetch',
    'x402-hono',
    'zod',
  ],
});
