import { describe, expect, it } from 'bun:test';

import { resolveAgentWalletFromEnv } from '../../env';

describe('resolveAgentWalletFromEnv', () => {
  it('resolves thirdweb wallet from AGENT_WALLET_ environment variables', () => {
    const env = {
      AGENT_WALLET_TYPE: 'thirdweb',
      AGENT_WALLET_SECRET_KEY: 'test-secret-key',
      AGENT_WALLET_CLIENT_ID: 'test-client-id',
      AGENT_WALLET_LABEL: 'test-wallet',
      AGENT_WALLET_CHAIN_ID: '84532',
    };

    const config = resolveAgentWalletFromEnv(env);

    expect(config).toBeDefined();
    expect(config?.type).toBe('thirdweb');
    if (config?.type === 'thirdweb') {
      expect(config.secretKey).toBe('test-secret-key');
      expect(config.clientId).toBe('test-client-id');
      expect(config.walletLabel).toBe('test-wallet');
      expect(config.chainId).toBe(84532);
    }
  });

  it('resolves thirdweb wallet with defaults', () => {
    const env = {
      AGENT_WALLET_TYPE: 'thirdweb',
      AGENT_WALLET_SECRET_KEY: 'test-secret-key',
      // No chain ID - should default to 84532
    };

    const config = resolveAgentWalletFromEnv(env);

    expect(config).toBeDefined();
    expect(config?.type).toBe('thirdweb');
    if (config?.type === 'thirdweb') {
      expect(config.secretKey).toBe('test-secret-key');
      expect(config.walletLabel).toBe('agent-wallet'); // Default
      expect(config.chainId).toBe(84532); // Default
    }
  });

  it('throws error when thirdweb secret key is missing', () => {
    const env = {
      AGENT_WALLET_TYPE: 'thirdweb',
      // No secret key
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'AGENT_WALLET_SECRET_KEY environment variable is required when AGENT_WALLET_TYPE=thirdweb.'
    );
  });

  it('throws error when thirdweb chain ID is invalid', () => {
    const env = {
      AGENT_WALLET_TYPE: 'thirdweb',
      AGENT_WALLET_SECRET_KEY: 'test-secret-key',
      AGENT_WALLET_CHAIN_ID: 'invalid',
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'Invalid AGENT_WALLET_CHAIN_ID: "invalid". Must be a valid integer.'
    );
  });

  it('throws error when AGENT_WALLET_TYPE is missing', () => {
    const env = {};

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'AGENT_WALLET_TYPE environment variable is required. Set it to "local", "thirdweb", or "regent".'
    );
  });

  it('throws error when AGENT_WALLET_TYPE is invalid', () => {
    const env = {
      AGENT_WALLET_TYPE: 'invalid-type',
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'Invalid AGENT_WALLET_TYPE: "invalid-type". Must be one of: "local", "thirdweb", "regent".'
    );
  });

  it('throws error when AGENT_WALLET_TYPE is local but AGENT_WALLET_PRIVATE_KEY is missing', () => {
    const env = {
      AGENT_WALLET_TYPE: 'local',
      // No private key
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'AGENT_WALLET_PRIVATE_KEY environment variable is required when AGENT_WALLET_TYPE=local.'
    );
  });

  it('resolves local wallet when AGENT_WALLET_PRIVATE_KEY is provided', () => {
    const env = {
      AGENT_WALLET_TYPE: 'local',
      AGENT_WALLET_PRIVATE_KEY:
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    };

    const config = resolveAgentWalletFromEnv(env);

    expect(config).toBeDefined();
    expect(config?.type).toBe('local');
    if (config?.type === 'local') {
      expect(config.privateKey).toBe(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );
    }
  });

  it('throws error when Regent wallet baseUrl is missing', () => {
    const env = {
      AGENT_WALLET_TYPE: 'regent',
      AGENT_WALLET_AGENT_REF: 'test-agent-ref',
      // No baseUrl
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'Missing required environment variables for Regent wallet: AGENT_WALLET_BASE_URL (or REGENT_BASE_URL or REGENT_API_URL)'
    );
  });

  it('throws error when Regent wallet agentRef is missing', () => {
    const env = {
      AGENT_WALLET_TYPE: 'regent',
      AGENT_WALLET_BASE_URL: 'https://api.example.com',
      // No agentRef
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'Missing required environment variables for Regent wallet: AGENT_WALLET_AGENT_REF'
    );
  });

  it('throws error when Regent wallet both baseUrl and agentRef are missing', () => {
    const env = {
      AGENT_WALLET_TYPE: 'regent',
      // No baseUrl or agentRef
    };

    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'Missing required environment variables for Regent wallet:'
    );
    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'AGENT_WALLET_BASE_URL (or REGENT_BASE_URL or REGENT_API_URL)'
    );
    expect(() => resolveAgentWalletFromEnv(env)).toThrow(
      'AGENT_WALLET_AGENT_REF'
    );
  });

  it('resolves Regent wallet when all required fields are provided', () => {
    const env = {
      AGENT_WALLET_TYPE: 'regent',
      AGENT_WALLET_BASE_URL: 'https://api.example.com',
      AGENT_WALLET_AGENT_REF: 'test-agent-ref',
    };

    const config = resolveAgentWalletFromEnv(env);

    expect(config).toBeDefined();
    expect(config?.type).toBe('regent');
    if (config?.type === 'regent') {
      expect(config.baseUrl).toBe('https://api.example.com');
      expect(config.agentRef).toBe('test-agent-ref');
    }
  });
});
