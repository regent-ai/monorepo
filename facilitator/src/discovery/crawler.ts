import type { PaymentRequired } from "@x402/core/types";

import type { DiscoveryCatalogStore } from "./catalog";
import { tryGetPaymentRequiredFromResponse } from "../utils/paymentRequiredHeader";

export interface DiscoveryCrawlOptions {
  seedUrls: string[];
  maxDepth?: number;
  maxRequests?: number;
  timeoutMs?: number;
}

export interface DiscoveryCrawlResult {
  visited: number;
  stored: number;
  errors: Array<{ url: string; error: string }>;
}

type DiscoveryExtensionInfo = {
  input?: Record<string, unknown>;
};

type CrawlTarget = {
  url: string;
  depth: number;
  init: RequestInit;
};

function isPrivateHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "0.0.0.0") return true;
  if (lower.startsWith("127.")) return true;
  if (lower.startsWith("10.")) return true;
  if (lower.startsWith("192.168.")) return true;
  // 172.16.0.0 – 172.31.255.255
  if (lower.startsWith("172.")) {
    const second = Number.parseInt(lower.split(".")[1] ?? "", 10);
    if (Number.isInteger(second) && second >= 16 && second <= 31) return true;
  }
  return false;
}

function getDiscoveryInfo(paymentRequired: PaymentRequired): DiscoveryExtensionInfo | undefined {
  const extensions = paymentRequired.extensions as any;
  const discoveryExt = extensions?.discovery ?? extensions?.bazaar;
  if (!discoveryExt || typeof discoveryExt !== "object") return undefined;
  const info = "info" in discoveryExt ? (discoveryExt as any).info : discoveryExt;
  if (!info || typeof info !== "object") return undefined;
  return info as DiscoveryExtensionInfo;
}

function buildCrawlTargetFromDiscoveryInfo(
  paymentRequired: PaymentRequired,
  discoveryInfo: DiscoveryExtensionInfo,
  depth: number,
): CrawlTarget | undefined {
  const input = discoveryInfo.input;
  if (!input || typeof input !== "object") return undefined;

  const methodRaw = (input as any).method;
  const method = typeof methodRaw === "string" ? methodRaw.toUpperCase() : "GET";

  // Target URL: prefer explicit input.url if provided, else use the resource url.
  const urlString = typeof (input as any).url === "string" ? (input as any).url : paymentRequired.resource.url;
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return undefined;
  }

  const queryParams = (input as any).queryParams;
  if (queryParams && typeof queryParams === "object") {
    for (const [k, v] of Object.entries(queryParams as Record<string, unknown>)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const headers: Record<string, string> = {};
  const inputHeaders = (input as any).headers;
  if (inputHeaders && typeof inputHeaders === "object") {
    for (const [k, v] of Object.entries(inputHeaders as Record<string, unknown>)) {
      if (typeof v === "string") headers[k] = v;
    }
  }

  const init: RequestInit = {
    method,
    headers,
  };

  const bodyType = (input as any).bodyType;
  const body = (input as any).body;
  if (body && typeof body === "object" && (method === "POST" || method === "PUT" || method === "PATCH")) {
    if (bodyType === "json" || !bodyType) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
      init.body = JSON.stringify(body);
    }
  }

  return { url: url.toString(), depth, init };
}

export async function crawlDiscovery(
  store: DiscoveryCatalogStore,
  options: DiscoveryCrawlOptions,
): Promise<DiscoveryCrawlResult> {
  const maxDepth = options.maxDepth ?? 2;
  const maxRequests = options.maxRequests ?? 50;
  const timeoutMs = options.timeoutMs ?? 10_000;

  const seedOrigins = new Set<string>();
  for (const seed of options.seedUrls) {
    try {
      seedOrigins.add(new URL(seed).origin);
    } catch {
      // ignore invalid seed URL
    }
  }

  const queue: CrawlTarget[] = options.seedUrls.flatMap(seedUrl => {
    try {
      const url = new URL(seedUrl);
      if (isPrivateHostname(url.hostname)) return [];
      return [
        {
          url: url.toString(),
          depth: 0,
          init: { method: "GET" },
        },
      ];
    } catch {
      return [];
    }
  });

  const visitedKeys = new Set<string>();
  const errors: Array<{ url: string; error: string }> = [];
  let visited = 0;
  let stored = 0;

  while (queue.length > 0 && visited < maxRequests) {
    const target = queue.shift()!;
    if (target.depth > maxDepth) continue;

    const key = `${(target.init.method ?? "GET").toString().toUpperCase()} ${target.url}`;
    if (visitedKeys.has(key)) continue;
    visitedKeys.add(key);

    let url: URL;
    try {
      url = new URL(target.url);
    } catch {
      continue;
    }

    // Safety: only crawl same-origin as the seed URLs
    if (seedOrigins.size > 0 && !seedOrigins.has(url.origin)) continue;
    if (isPrivateHostname(url.hostname)) continue;

    visited += 1;

    try {
      const response = await fetch(target.url, {
        ...target.init,
        redirect: "follow",
        headers: {
          "User-Agent": "x402-facilitator-discovery/1.0",
          ...(target.init.headers ?? {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.status !== 402) continue;

      const paymentRequired = tryGetPaymentRequiredFromResponse(response);
      if (!paymentRequired) continue;

      const discoveryInfo = getDiscoveryInfo(paymentRequired);
      if (!discoveryInfo) continue;

      await store.upsert({
        resourceUrl: paymentRequired.resource.url,
        sourceUrl: target.url,
        lastSeenAt: new Date().toISOString(),
        paymentRequired,
      });
      stored += 1;

      const next = buildCrawlTargetFromDiscoveryInfo(paymentRequired, discoveryInfo, target.depth + 1);
      if (next) queue.push(next);
    } catch (err) {
      errors.push({
        url: target.url,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return { visited, stored, errors };
}


