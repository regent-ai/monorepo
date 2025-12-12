/**
 * Configuration file loading utilities
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import type { RegentProjectConfig, GlobalOptions } from '../types';
import { CONFIG_FILE_NAMES } from '../types';

/**
 * Find the config file path
 */
export function findConfigFile(cwd: string, override?: string): string | null {
  if (override) {
    const resolved = resolve(cwd, override);
    if (existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`Config file not found: ${override}`);
  }

  for (const name of CONFIG_FILE_NAMES) {
    const path = resolve(cwd, name);
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Load configuration from file
 */
export async function loadConfig(
  cwd: string,
  options: GlobalOptions
): Promise<{ config: RegentProjectConfig; configPath: string }> {
  const configPath = findConfigFile(cwd, options.config);

  if (!configPath) {
    throw new Error(
      `No config file found. Run 'regentx agent:init' to create one, or specify with --config.`
    );
  }

  const ext = configPath.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content) as RegentProjectConfig;
    return { config, configPath };
  }

  // For TS/JS files, we need to dynamically import
  // This requires the file to be transpiled or use a runtime that supports TS
  try {
    const imported = await import(configPath);
    const config = imported.default as RegentProjectConfig;
    return { config, configPath };
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${(error as Error).message}`
    );
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(
  configPath: string,
  config: RegentProjectConfig
): Promise<void> {
  const ext = configPath.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return;
  }

  // For TS/JS files, we need to generate code
  const content = `import { defineConfig } from '@regent/regentx';

export default defineConfig(${JSON.stringify(config, null, 2)});
`;
  await writeFile(configPath, content, 'utf-8');
}

/**
 * Helper for defining config with type safety
 */
export function defineConfig(config: RegentProjectConfig): RegentProjectConfig {
  return config;
}

/**
 * Generate a default config
 */
export function generateDefaultConfig(options: {
  name: string;
  chainId?: number;
  ownerConnectorId?: string;
  metadataUri?: string;
  deploymentMode?: 'mock' | 'onchain';
}): RegentProjectConfig {
  return {
    version: 1,
    agent: {
      name: options.name,
      ownerConnectorId: options.ownerConnectorId ?? 'local-eoa',
      metadata: {
        uri: options.metadataUri ?? 'ipfs://TODO',
      },
      deploymentMode: options.deploymentMode ?? 'mock',
      erc8004: options.chainId
        ? {
            chainId: options.chainId,
          }
        : undefined,
    },
  };
}
