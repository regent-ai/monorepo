import { definePackageConfig } from '../tsup.config.base';

export default definePackageConfig({
  entry: ['src/index.ts'],
  external: [
    '@regent/types',
    'viem',
    'graphql-request',
    'ipfs-http-client',
    'dotenv',
  ],
});
