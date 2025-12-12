import { config } from "dotenv";

config();

// Normalize private keys - add 0x prefix if missing
function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key.startsWith("0x") ? key : `0x${key}`;
}

export const RPC_URL = process.env.RPC_URL as string | undefined;
export const RPC_URLS_JSON = process.env.RPC_URLS_JSON;

function parseRpcUrlsJson(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).flatMap(([k, v]) =>
      typeof v === "string" && v.length > 0 ? [[k, v]] : [],
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export const RPC_URLS = parseRpcUrlsJson(RPC_URLS_JSON);
export const ERC8004_IDENTITY_REGISTRY_ADDRESS = process.env
  .ERC8004_IDENTITY_REGISTRY_ADDRESS as `0x${string}`;
export const DELEGATE_CONTRACT_ADDRESS = process.env.DELEGATE_CONTRACT_ADDRESS as `0x${string}`;
export const PORT = process.env.PORT || "4022";

export const FACILITATOR_PRIVATE_KEY = normalizePrivateKey(process.env.FACILITATOR_PRIVATE_KEY);

function parseStringList(value: string | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return parsed.flatMap(v => (typeof v === "string" ? [v] : []));
  } catch {
    // Fall back to comma-separated list
  }
  return trimmed
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

// Discovery (optional)
export const DISCOVERY_ENABLED = (process.env.DISCOVERY_ENABLED || "").toLowerCase() === "true";
export const DISCOVERY_SEEDS = parseStringList(process.env.DISCOVERY_SEEDS);
export const DISCOVERY_INTERVAL_SECONDS = Number.parseInt(
  process.env.DISCOVERY_INTERVAL_SECONDS || "300",
  10,
);
export const DISCOVERY_MAX_DEPTH = Number.parseInt(process.env.DISCOVERY_MAX_DEPTH || "2", 10);
export const DISCOVERY_MAX_REQUESTS = Number.parseInt(process.env.DISCOVERY_MAX_REQUESTS || "50", 10);
export const DISCOVERY_TIMEOUT_MS = Number.parseInt(process.env.DISCOVERY_TIMEOUT_MS || "10000", 10);
export const DISCOVERY_CATALOG_PATH = process.env.DISCOVERY_CATALOG_PATH;

if (!FACILITATOR_PRIVATE_KEY) {
  console.error("❌ FACILITATOR_PRIVATE_KEY environment variable is required");
  process.exit(1);
}

if (!RPC_URL) {
  if (Object.keys(RPC_URLS).length === 0) {
    console.error("❌ RPC_URL or RPC_URLS_JSON environment variable is required");
    process.exit(1);
  }
}

if (!ERC8004_IDENTITY_REGISTRY_ADDRESS) {
  console.error("❌ ERC8004_IDENTITY_REGISTRY_ADDRESS environment variable is required");
  process.exit(1);
}

if (!DELEGATE_CONTRACT_ADDRESS) {
  console.error("❌ DELEGATE_CONTRACT_ADDRESS environment variable is required");
  process.exit(1);
}
