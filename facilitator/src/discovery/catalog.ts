import { promises as fs } from "node:fs";
import path from "node:path";

import type { PaymentRequired } from "@x402/core/types";

export interface DiscoveryCatalogEntry {
  resourceUrl: string;
  sourceUrl: string;
  lastSeenAt: string;
  paymentRequired: PaymentRequired;
}

export interface DiscoveryCatalogFile {
  version: 1;
  updatedAt: string;
  entries: Record<string, DiscoveryCatalogEntry>;
}

export interface DiscoveryCatalogStore {
  readonly filePath: string;
  list(): DiscoveryCatalogEntry[];
  get(resourceUrl: string): DiscoveryCatalogEntry | undefined;
  upsert(entry: DiscoveryCatalogEntry): Promise<void>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultCatalogPath(): string {
  return path.resolve(process.cwd(), "data", "discovery-catalog.json");
}

async function readCatalogFile(filePath: string): Promise<DiscoveryCatalogFile> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") throw new Error("invalid catalog");
    const obj = parsed as Partial<DiscoveryCatalogFile>;
    if (obj.version !== 1 || !obj.entries || typeof obj.entries !== "object") {
      throw new Error("invalid catalog shape");
    }
    return {
      version: 1,
      updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : nowIso(),
      entries: obj.entries as Record<string, DiscoveryCatalogEntry>,
    };
  } catch {
    return { version: 1, updatedAt: nowIso(), entries: {} };
  }
}

async function writeCatalogFile(filePath: string, catalog: DiscoveryCatalogFile): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(catalog, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

export async function createDiscoveryCatalogStore(
  filePath: string = defaultCatalogPath(),
): Promise<DiscoveryCatalogStore> {
  let catalog = await readCatalogFile(filePath);

  return {
    filePath,
    list() {
      return Object.values(catalog.entries);
    },
    get(resourceUrl: string) {
      return catalog.entries[resourceUrl];
    },
    async upsert(entry: DiscoveryCatalogEntry) {
      catalog = {
        version: 1,
        updatedAt: nowIso(),
        entries: {
          ...catalog.entries,
          [entry.resourceUrl]: entry,
        },
      };
      await writeCatalogFile(filePath, catalog);
    },
  };
}



