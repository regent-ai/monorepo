import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/abi/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
});
