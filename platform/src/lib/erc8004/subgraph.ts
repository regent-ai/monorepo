/**
 * Subgraph client for querying ERC-8004 agents from The Graph
 *
 * This module provides functions to fetch agent data from the Regent subgraph
 * deployed on Ethereum Sepolia.
 */

import { env } from "~/env/client";

// Use env var or fallback to public endpoint
const SUBGRAPH_URL =
  env.VITE_ERC8004_SUBGRAPH_URL ||
  "https://gateway.thegraph.com/api/00a452ad3cd1900273ea62c1bf283f93/subgraphs/id/6wQRC7geo9XYAhckfmfo8kbMRLeWU8KQd3XsJqFKmZLT";

/**
 * Agent entity from the subgraph
 */
export interface Agent {
  id: string; // Format: "chainId:tokenId"
  chainId: string;
  agentId: string; // Token ID
  owner: string; // Wallet address
  metadataUri: string;
  createdAt: string; // Unix timestamp
  updatedAt: string;
  totalFeedback: string;
  registrationFile: {
    name: string | null;
    description: string | null;
    image: string | null;
    mcpEndpoint: string | null;
    a2aEndpoint: string | null;
    supportedTrusts: string[] | null;
    ens?: string | null;
    agentWallet?: string | null;
  } | null;
}

/**
 * Feedback/review entity from the subgraph
 */
export interface Feedback {
  id: string;
  score: string; // 0-100
  tag1: string | null;
  tag2: string | null;
  clientAddress: string; // Reviewer's wallet
  createdAt: string;
  isRevoked: boolean;
  feedbackFile: {
    text: string | null;
    capability: string | null;
    skill: string | null;
  } | null;
}

/**
 * Filter options for fetching agents
 */
export interface AgentFilters {
  search?: string;
  hasReviews?: boolean;
  hasEndpoint?: boolean;
}

type AgentWhere = Record<string, unknown>;

type SubgraphAgent = Omit<Agent, "metadataUri"> & { agentURI: string };
type SubgraphAgentWithFeedback = SubgraphAgent & { feedback: Feedback[] };

function buildAgentWhere(filters?: AgentFilters): AgentWhere | null {
  if (!filters) return null;

  const and: AgentWhere[] = [];

  if (filters.search) {
    and.push({
      registrationFile_: { name_contains_nocase: filters.search },
    });
  }

  if (filters.hasReviews) {
    and.push({ totalFeedback_gt: 0 });
  }

  if (filters.hasEndpoint) {
    and.push({
      or: [
        { registrationFile_: { mcpEndpoint_not: null } },
        { registrationFile_: { a2aEndpoint_not: null } },
      ],
    });
  }

  if (and.length === 0) return null;
  if (and.length === 1) return and[0]!;
  return { and };
}

/**
 * Fetches a paginated list of agents from the subgraph
 */
export async function fetchAgents(
  first: number = 24,
  skip: number = 0,
  filters?: AgentFilters
): Promise<Agent[]> {
  const where = buildAgentWhere(filters);

  const query = `
    query Agents($first: Int!, $skip: Int!, $where: Agent_filter) {
      agents(
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: desc
        where: $where
      ) {
        id
        chainId
        agentId
        owner
        agentURI
        createdAt
        updatedAt
        totalFeedback
        registrationFile {
          name
          description
          image
          mcpEndpoint
          a2aEndpoint
          supportedTrusts
        }
      }
    }
  `;

  const data = await querySubgraph<{ agents: SubgraphAgent[] }>(query, {
    first,
    skip,
    where,
  });

  // Map agentURI to metadataUri and resolve missing metadata
  const agents = await Promise.all(
    data.agents.map(async (agent) => {
      let registrationFile = agent.registrationFile;
      if (!registrationFile && agent.agentURI) {
        registrationFile = await resolveMetadataCached(agent.agentURI);
      }

      const { agentURI, ...rest } = agent;
      return {
        ...rest,
        metadataUri: agentURI,
        registrationFile,
      };
    })
  );

  return agents;
}

/**
 * Fetches a single agent with its feedback/reviews
 */
export async function fetchAgentWithFeedback(
  agentId: string
): Promise<{ agent: Agent | null; feedback: Feedback[] }> {
  const query = `
    query AgentWithFeedback($id: ID!) {
      agent(id: $id) {
        id
        chainId
        agentId
        agentURI
        owner
        createdAt
        updatedAt
        totalFeedback
        registrationFile {
          name
          description
          image
          mcpEndpoint
          a2aEndpoint
          supportedTrusts
          ens
          agentWallet
        }
        feedback(
          first: 50
          orderBy: createdAt
          orderDirection: desc
          where: { isRevoked: false }
        ) {
          id
          score
          tag1
          tag2
          clientAddress
          createdAt
          isRevoked
          feedbackFile {
            text
            capability
            skill
          }
        }
      }
    }
  `;

  const data = await querySubgraph<{ agent: SubgraphAgentWithFeedback | null }>(
    query,
    { id: agentId }
  );

  const agent = data.agent;

  if (!agent) {
    return { agent: null, feedback: [] };
  }

  let registrationFile = agent.registrationFile;
  if (!registrationFile && agent.agentURI) {
    registrationFile = await resolveMetadataCached(agent.agentURI);
  }

  const { agentURI, feedback, ...rest } = agent;
  return {
    agent: { ...rest, metadataUri: agentURI, registrationFile },
    feedback: feedback || [],
  };
}

/**
 * Counts agents matching the given filters
 */
export async function fetchAgentCount(filters?: AgentFilters): Promise<number> {
  const where = buildAgentWhere(filters);

  // Prefer connection totalCount if the subgraph exposes it. Fallback to a
  // lightweight id-only query if not available.
  const connectionQuery = `
    query AgentsCount($where: Agent_filter) {
      agentsConnection(where: $where) {
        totalCount
      }
    }
  `;

  try {
    const data = await querySubgraph<{
      agentsConnection: { totalCount: number } | null;
    }>(connectionQuery, { where });
    const total = data.agentsConnection?.totalCount;
    if (typeof total === "number") return total;
  } catch {
    // ignore and fallback
  }

  const fallbackQuery = `
    query AgentsCountFallback($where: Agent_filter) {
      agents(first: 1000, where: $where) {
        id
      }
    }
  `;

  const fallback = await querySubgraph<{ agents: { id: string }[] }>(
    fallbackQuery,
    { where }
  );

  return fallback.agents.length;
}

/**
 * Fetches global statistics from the subgraph
 */
export async function fetchGlobalStats(): Promise<{
  totalAgents: string;
  totalFeedback: string;
}> {
  const query = `
    {
      globalStats(id: "global") {
        totalAgents
        totalFeedback
      }
    }
  `;

  const data = (await querySubgraph(query)) as {
    globalStats: { totalAgents: string; totalFeedback: string };
  };
  return data.globalStats;
}

/**
 * Resolves and fetches metadata from a URI
 */
const metadataPromiseCache = new Map<
  string,
  Promise<Agent["registrationFile"]>
>();

function resolveMetadataCached(uri: string): Promise<Agent["registrationFile"]> {
  const hit = metadataPromiseCache.get(uri);
  if (hit) return hit;

  const p = resolveMetadata(uri).catch(() => {
    metadataPromiseCache.delete(uri);
    return null;
  });

  metadataPromiseCache.set(uri, p);
  return p;
}

async function resolveMetadata(uri: string): Promise<Agent["registrationFile"]> {
  try {
    let jsonData: string;

    if (uri.startsWith("data:")) {
      const base64Match = uri.match(/^data:[^;]+;base64,(.+)$/);
      if (!base64Match) return null;
      jsonData = atob(base64Match[1]);
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      // Avoid Mixed Content in production: browsers will block http:// fetches from https:// pages.
      // If we detect that case, opportunistically upgrade to https:// (works for most modern hosts).
      const safeUri = upgradeInsecureHttpForHttpsPages(uri);

      const response = await fetch(safeUri);
      if (!response.ok) return null;
      jsonData = await response.text();
    } else if (uri.startsWith("ipfs://")) {
      const hash = uri.replace("ipfs://", "");
      const response = await fetch(`https://ipfs.io/ipfs/${hash}`);
      if (!response.ok) return null;
      jsonData = await response.text();
    } else {
      return null;
    }

    const metadata = JSON.parse(jsonData);

    return {
      name: metadata.name || null,
      description: metadata.description || null,
      image: metadata.image || null,
      mcpEndpoint: metadata.mcpEndpoint || null,
      a2aEndpoint: metadata.a2aEndpoint || null,
      supportedTrusts: metadata.supportedTrusts || null,
    };
  } catch {
    return null;
  }
}

function upgradeInsecureHttpForHttpsPages(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.protocol !== "http:") return uri;

    // Allow local dev servers to remain http
    const host = u.hostname.toLowerCase();
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost");

    const isBrowser = typeof window !== "undefined";
    const isHttpsPage = isBrowser && window.location.protocol === "https:";

    if (!isHttpsPage || isLocal) return uri;

    u.protocol = "https:";
    return u.toString();
  } catch {
    return uri;
  }
}

/**
 * Helper function to execute GraphQL queries against the subgraph
 */
async function querySubgraph<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Subgraph request failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (result.errors?.length) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }

  if (!result.data) {
    throw new Error("Subgraph response missing data");
  }

  return result.data;
}
