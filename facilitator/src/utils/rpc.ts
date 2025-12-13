import { RPC_URL, RPC_URLS } from "../config/env";

const NETWORK_ALIASES: Record<string, string[]> = {
  "base-sepolia": ["eip155:84532"],
  base: ["eip155:8453"],
};

export function getRpcUrlForNetwork(network: string | undefined): string {
  const candidates = [
    ...(network ? [network] : []),
    ...(network ? (NETWORK_ALIASES[network] ?? []) : []),
  ];

  for (const candidate of candidates) {
    const rpcUrl = RPC_URLS[candidate];
    if (rpcUrl) return rpcUrl;
  }

  if (RPC_URL) return RPC_URL;

  throw new Error("RPC URL not configured (set RPC_URL or RPC_URLS_JSON)");
}



