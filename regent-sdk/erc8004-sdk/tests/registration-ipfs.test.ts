/**
 * Integration test for Agent Registration with IPFS Pin (using Pinata)
 * Creates an agent, updates it on-chain, deletes it, reloads it, and verifies data integrity.
 */

import { SDK } from '../src/index';
import { CHAIN_ID, RPC_URL, AGENT_PRIVATE_KEY, PINATA_JWT, printConfig } from './config';

function generateRandomData() {
  const randomSuffix = Math.floor(Math.random() * 9000) + 1000;
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    name: `Test Agent ${randomSuffix}`,
    description: `Created at ${timestamp}`,
    image: `https://example.com/image_${randomSuffix}.png`,
    mcpEndpoint: `https://api.example.com/mcp/${randomSuffix}`,
    mcpVersion: `2025-06-${Math.floor(Math.random() * 28) + 1}`,
    a2aEndpoint: `https://api.example.com/a2a/${randomSuffix}.json`,
    a2aVersion: `0.${Math.floor(Math.random() * 6) + 30}`,
    ensName: `test${randomSuffix}.eth`,
    ensVersion: `1.${Math.floor(Math.random() * 10)}`,
    walletAddress: `0x${'a'.repeat(40)}`,
    walletChainId: [1, 11155111, 8453, 137, 42161][Math.floor(Math.random() * 5)],
    active: true,
    x402support: false,
    reputation: Math.random() > 0.5,
    cryptoEconomic: Math.random() > 0.5,
    teeAttestation: Math.random() > 0.5,
  };
}

describe('Agent Registration with IPFS Pin', () => {
  let sdk: SDK;
  let testData: ReturnType<typeof generateRandomData>;
  let agentId: string;

  beforeAll(() => {
    printConfig();
  });

  it('should register new agent with IPFS', async () => {
    // SDK Configuration with Pinata IPFS
    const sdkConfig = {
      chainId: CHAIN_ID,
      rpcUrl: RPC_URL,
      signer: AGENT_PRIVATE_KEY,
      ipfs: 'pinata' as const,
      pinataJwt: PINATA_JWT,
    };

    sdk = new SDK(sdkConfig);
    testData = generateRandomData();

    const agent = sdk.createAgent(testData.name, testData.description, testData.image);

    await agent.setMCP(testData.mcpEndpoint, testData.mcpVersion, false); // Disable endpoint crawling (2B)
    await agent.setA2A(testData.a2aEndpoint, testData.a2aVersion, false); // Disable endpoint crawling (2B)
    agent.setENS(testData.ensName, testData.ensVersion);
    agent.setAgentWallet(testData.walletAddress, testData.walletChainId);
    agent.setActive(testData.active);
    agent.setX402Support(testData.x402support);
    agent.setTrust(testData.reputation, testData.cryptoEconomic, testData.teeAttestation);

    const registrationFile = await agent.registerIPFS();
    agentId = registrationFile.agentId!;

    expect(agentId).toBeTruthy();
    expect(registrationFile.agentURI).toBeTruthy();
    expect(registrationFile.agentURI!.startsWith('ipfs://')).toBe(true);
  });

  it('should update agent registration', async () => {
    const agent = await sdk.loadAgent(agentId);

    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;

    agent.updateInfo(
      testData.name + ' UPDATED',
      testData.description + ' - UPDATED',
      `https://example.com/image_${Math.floor(Math.random() * 9000) + 1000}_updated.png`
    );
    await agent.setMCP(`https://api.example.com/mcp/${randomSuffix}`, `2025-06-${Math.floor(Math.random() * 28) + 1}`, false); // Disable endpoint crawling (2B)
    await agent.setA2A(
      `https://api.example.com/a2a/${randomSuffix}.json`,
      `0.${Math.floor(Math.random() * 6) + 30}`,
      false // Disable endpoint crawling (2B)
    );
    agent.setAgentWallet(`0x${'b'.repeat(40)}`, [1, 11155111, 8453, 137, 42161][Math.floor(Math.random() * 5)]);
    agent.setENS(`${testData.ensName}.updated`, `1.${Math.floor(Math.random() * 10)}`);
    agent.setActive(false);
    agent.setX402Support(true);
    agent.setTrust(Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5);
    agent.setMetadata({
      testKey: 'testValue',
      timestamp: Math.floor(Date.now() / 1000),
      customField: 'customValue',
      anotherField: 'anotherValue',
      numericField: Math.floor(Math.random() * 9000) + 1000,
    });

    const updatedRegistrationFile = await agent.registerIPFS();
    expect(updatedRegistrationFile.agentURI).toBeTruthy();
  });

  it('should reload and verify updated agent', async () => {
    // Wait for blockchain transaction to be mined
    await new Promise((resolve) => setTimeout(resolve, 15000)); // 15 seconds

    const reloadedAgent = await sdk.loadAgent(agentId);

    expect(reloadedAgent.name).toBe(testData.name + ' UPDATED');
    expect(reloadedAgent.description).toContain('UPDATED');
    expect(reloadedAgent.getRegistrationFile().active).toBe(false);
    expect(reloadedAgent.getRegistrationFile().x402support).toBe(true);
  });
});

