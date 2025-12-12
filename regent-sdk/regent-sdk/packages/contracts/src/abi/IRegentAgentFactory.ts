/**
 * ABI for the IRegentAgentFactory Solidity interface
 *
 * This ABI is derived from the Solidity interface defined in the plan.
 * It will be used by ViemRegentAgentFactory to interact with deployed contracts.
 */

export const IREGENT_AGENT_FACTORY_ABI = [
  // FactoryConfig struct return
  {
    inputs: [],
    name: 'factoryConfig',
    outputs: [
      {
        components: [
          { name: 'bondToken', type: 'address' },
          { name: 'maxRakeBps', type: 'uint16' },
          { name: 'defaultTreasury', type: 'address' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // nextAgentId
  {
    inputs: [],
    name: 'nextAgentId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // createAgent
  {
    inputs: [
      {
        components: [
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataURI', type: 'string' },
          { name: 'treasury', type: 'address' },
          { name: 'rakeBps', type: 'uint16' },
          { name: 'initialBond', type: 'uint256' },
          { name: 'identityRegistry', type: 'address' },
          { name: 'identityData', type: 'bytes' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'createAgent',
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // getAgent
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getAgent',
    outputs: [
      {
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'metadataURI', type: 'string' },
          { name: 'treasury', type: 'address' },
          { name: 'rakeBps', type: 'uint16' },
          { name: 'bondToken', type: 'address' },
          { name: 'bondAmount', type: 'uint256' },
          { name: 'paused', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },

  // getAgentsByOwner
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getAgentsByOwner',
    outputs: [{ name: 'agentIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },

  // updateMetadata
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
    ],
    name: 'updateMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // setPaused
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'paused', type: 'bool' },
    ],
    name: 'setPaused',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // changeOwner
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    name: 'changeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // setTreasury
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'treasury', type: 'address' },
      { name: 'rakeBps', type: 'uint16' },
    ],
    name: 'setTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // depositBond
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'depositBond',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // withdrawBond
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'withdrawBond',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'metadataURI', type: 'string' },
      { indexed: false, name: 'treasury', type: 'address' },
      { indexed: false, name: 'rakeBps', type: 'uint16' },
      { indexed: false, name: 'bondToken', type: 'address' },
      { indexed: false, name: 'initialBond', type: 'uint256' },
      { indexed: false, name: 'identityRegistry', type: 'address' },
      { indexed: false, name: 'identityTokenId', type: 'uint256' },
    ],
    name: 'AgentCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'metadataURI', type: 'string' },
    ],
    name: 'AgentMetadataUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: true, name: 'oldOwner', type: 'address' },
      { indexed: true, name: 'newOwner', type: 'address' },
    ],
    name: 'AgentOwnerUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'paused', type: 'bool' },
    ],
    name: 'AgentPaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'bondToken', type: 'address' },
      { indexed: false, name: 'bondAmount', type: 'uint256' },
    ],
    name: 'AgentBondUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'agentId', type: 'uint256' },
      { indexed: false, name: 'treasury', type: 'address' },
      { indexed: false, name: 'rakeBps', type: 'uint16' },
    ],
    name: 'AgentTreasuryUpdated',
    type: 'event',
  },

  // Errors
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'caller', type: 'address' },
    ],
    name: 'NotAgentOwner',
    type: 'error',
  },
  {
    inputs: [{ name: 'rakeBps', type: 'uint16' }],
    name: 'InvalidRakeBps',
    type: 'error',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'AgentDoesNotExist',
    type: 'error',
  },
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'AgentIsPaused',
    type: 'error',
  },
] as const;

export type IRegentAgentFactoryAbi = typeof IREGENT_AGENT_FACTORY_ABI;
