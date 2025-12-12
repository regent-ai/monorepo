import type { BuildContext, Extension } from '@regent/types/core';
import type { WalletsConfig, WalletsRuntime } from '@regent/types/wallets';

import { createWalletsRuntime } from './runtime';

export function wallets(
  options?: { config?: WalletsConfig }
): Extension<{ wallets?: WalletsRuntime }> {
  return {
    name: 'wallets',
    build(ctx: BuildContext): { wallets?: WalletsRuntime } {
      const walletsRuntime = createWalletsRuntime(options?.config);
      return { wallets: walletsRuntime };
    },
  };
}

