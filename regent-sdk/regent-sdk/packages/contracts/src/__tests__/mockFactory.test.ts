import { describe, it, expect, beforeEach } from 'bun:test';
import { InMemoryAgentFactory } from '../mockFactory';
import type { Address } from '../interfaces';

describe('InMemoryAgentFactory', () => {
  let factory: InMemoryAgentFactory;
  const owner: Address = '0x1234567890123456789012345678901234567890';
  const otherOwner: Address = '0xabcdef0123456789abcdef0123456789abcdef01';

  beforeEach(() => {
    factory = new InMemoryAgentFactory({ chainId: 11155111 });
  });

  describe('createAgent', () => {
    it('should create an agent with basic parameters', async () => {
      const result = await factory.createAgent({
        name: 'Test Agent',
        owner,
        metadataUri: 'ipfs://test-metadata',
      });

      expect(result.agentId).toBe('11155111:1');
      expect(result.owner).toBe(owner);
      expect(result.metadataUri).toBe('ipfs://test-metadata');
      expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should increment agent IDs', async () => {
      const agent1 = await factory.createAgent({
        name: 'Agent 1',
        owner,
        metadataUri: 'ipfs://1',
      });

      const agent2 = await factory.createAgent({
        name: 'Agent 2',
        owner,
        metadataUri: 'ipfs://2',
      });

      expect(agent1.agentId).toBe('11155111:1');
      expect(agent2.agentId).toBe('11155111:2');
    });

    it('should store treasury config', async () => {
      const treasury: Address = '0x9999999999999999999999999999999999999999';

      await factory.createAgent({
        name: 'Agent with Treasury',
        owner,
        metadataUri: 'ipfs://test',
        treasuryConfig: {
          treasury,
          rakeBps: 500,
        },
      });

      const agent = await factory.getAgent('11155111:1');
      expect(agent?.treasury).toEqual({
        address: treasury,
        rakeBps: 500,
      });
    });

    it('should reject rake exceeding max', async () => {
      await expect(
        factory.createAgent({
          name: 'Agent',
          owner,
          metadataUri: 'ipfs://test',
          treasuryConfig: {
            rakeBps: 3000, // exceeds default max of 2000
          },
        })
      ).rejects.toThrow('Invalid rake');
    });

    it('should store initial bond', async () => {
      await factory.createAgent({
        name: 'Bonded Agent',
        owner,
        metadataUri: 'ipfs://test',
        initialBondAmount: 1000000000000000000n,
      });

      const agent = await factory.getAgent('11155111:1');
      expect(agent?.bond?.amount).toBe(1000000000000000000n);
    });
  });

  describe('getAgent', () => {
    it('should return null for non-existent agent', async () => {
      const agent = await factory.getAgent('11155111:999');
      expect(agent).toBeNull();
    });

    it('should return agent state', async () => {
      await factory.createAgent({
        name: 'Test Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      const agent = await factory.getAgent('11155111:1');
      expect(agent).not.toBeNull();
      expect(agent?.name).toBe('Test Agent');
      expect(agent?.owner).toBe(owner);
      expect(agent?.metadataUri).toBe('ipfs://test');
      expect(agent?.paused).toBe(false);
    });
  });

  describe('getAgentsByOwner', () => {
    it('should return empty array for owner with no agents', async () => {
      const agents = await factory.getAgentsByOwner(owner);
      expect(agents).toEqual([]);
    });

    it('should return all agents for an owner', async () => {
      await factory.createAgent({
        name: 'Agent 1',
        owner,
        metadataUri: 'ipfs://1',
      });

      await factory.createAgent({
        name: 'Agent 2',
        owner,
        metadataUri: 'ipfs://2',
      });

      await factory.createAgent({
        name: 'Other Agent',
        owner: otherOwner,
        metadataUri: 'ipfs://3',
      });

      const ownerAgents = await factory.getAgentsByOwner(owner);
      expect(ownerAgents).toHaveLength(2);
      expect(ownerAgents.map((a) => a.name)).toEqual(['Agent 1', 'Agent 2']);
    });
  });

  describe('updateMetadata', () => {
    it('should update metadata URI', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://original',
      });

      await factory.updateMetadata('11155111:1', 'ipfs://updated');

      const agent = await factory.getAgent('11155111:1');
      expect(agent?.metadataUri).toBe('ipfs://updated');
    });

    it('should throw for non-existent agent', async () => {
      await expect(
        factory.updateMetadata('11155111:999', 'ipfs://test')
      ).rejects.toThrow('Agent not found');
    });
  });

  describe('setPaused', () => {
    it('should pause and unpause agent', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      await factory.setPaused('11155111:1', true);
      let agent = await factory.getAgent('11155111:1');
      expect(agent?.paused).toBe(true);

      await factory.setPaused('11155111:1', false);
      agent = await factory.getAgent('11155111:1');
      expect(agent?.paused).toBe(false);
    });
  });

  describe('changeOwner', () => {
    it('should transfer ownership', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      await factory.changeOwner('11155111:1', otherOwner);

      const agent = await factory.getAgent('11155111:1');
      expect(agent?.owner).toBe(otherOwner);

      // Check index updated
      const oldOwnerAgents = await factory.getAgentsByOwner(owner);
      expect(oldOwnerAgents).toHaveLength(0);

      const newOwnerAgents = await factory.getAgentsByOwner(otherOwner);
      expect(newOwnerAgents).toHaveLength(1);
    });
  });

  describe('setTreasury', () => {
    it('should update treasury config', async () => {
      const treasury: Address = '0x9999999999999999999999999999999999999999';

      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      await factory.setTreasury('11155111:1', treasury, 1000);

      const agent = await factory.getAgent('11155111:1');
      expect(agent?.treasury).toEqual({
        address: treasury,
        rakeBps: 1000,
      });
    });

    it('should reject invalid rake', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      await expect(
        factory.setTreasury(
          '11155111:1',
          '0x9999999999999999999999999999999999999999',
          5000 // exceeds max
        )
      ).rejects.toThrow('Invalid rake');
    });
  });

  describe('bond operations', () => {
    it('should deposit and withdraw bond', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
      });

      await factory.depositBond('11155111:1', 1000n);

      let agent = await factory.getAgent('11155111:1');
      expect(agent?.bond?.amount).toBe(1000n);

      await factory.depositBond('11155111:1', 500n);
      agent = await factory.getAgent('11155111:1');
      expect(agent?.bond?.amount).toBe(1500n);

      await factory.withdrawBond('11155111:1', owner, 300n);
      agent = await factory.getAgent('11155111:1');
      expect(agent?.bond?.amount).toBe(1200n);
    });

    it('should reject withdrawal exceeding balance', async () => {
      await factory.createAgent({
        name: 'Agent',
        owner,
        metadataUri: 'ipfs://test',
        initialBondAmount: 100n,
      });

      await expect(
        factory.withdrawBond('11155111:1', owner, 200n)
      ).rejects.toThrow('Insufficient bond balance');
    });
  });

  describe('getFactoryConfig', () => {
    it('should return factory config', async () => {
      const config = await factory.getFactoryConfig();
      expect(config.maxRakeBps).toBe(2000);
      expect(config.bondToken).toBe(
        '0x0000000000000000000000000000000000000000'
      );
    });

    it('should use custom config', async () => {
      const customFactory = new InMemoryAgentFactory({
        chainId: 1,
        config: {
          maxRakeBps: 5000,
          defaultTreasury: '0x1111111111111111111111111111111111111111',
        },
      });

      const config = await customFactory.getFactoryConfig();
      expect(config.maxRakeBps).toBe(5000);
      expect(config.defaultTreasury).toBe(
        '0x1111111111111111111111111111111111111111'
      );
    });
  });

  describe('reset', () => {
    it('should clear all state', async () => {
      await factory.createAgent({
        name: 'Agent 1',
        owner,
        metadataUri: 'ipfs://1',
      });

      await factory.createAgent({
        name: 'Agent 2',
        owner,
        metadataUri: 'ipfs://2',
      });

      expect(factory.getAgentCount()).toBe(2);

      factory.reset();

      expect(factory.getAgentCount()).toBe(0);

      // Next agent should start at ID 1 again
      const newAgent = await factory.createAgent({
        name: 'New Agent',
        owner,
        metadataUri: 'ipfs://new',
      });
      expect(newAgent.agentId).toBe('11155111:1');
    });
  });
});
