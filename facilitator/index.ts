// ============================================================================
// Imports
// ============================================================================

import express from "express";
import { x402Facilitator } from "@x402/core/facilitator";
// Import legacy (v1) verify/settle functions
import { verify as legacyVerify, settle as legacySettle } from "x402/verify";
import type {
  PaymentPayload as LegacyPaymentPayload,
  PaymentRequirements as LegacyPaymentRequirements,
  VerifyResponse as LegacyVerifyResponse,
  SettleResponse as LegacySettleResponse,
} from "x402/types";
import type {
  PaymentRequirements,
  PaymentPayload,
  VerifyResponse,
  SettleResponse,
  SupportedResponse,
} from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { createWalletClient, http, isAddress, publicActions, type Address, type Authorization } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Import config
import {
  PORT,
  FACILITATOR_PRIVATE_KEY,
  DISCOVERY_ENABLED,
  DISCOVERY_SEEDS,
  DISCOVERY_INTERVAL_SECONDS,
  DISCOVERY_MAX_DEPTH,
  DISCOVERY_MAX_REQUESTS,
  DISCOVERY_TIMEOUT_MS,
  DISCOVERY_CATALOG_PATH,
} from "./src/config/env";

// Import utils
import { mapX402NetworkToChain } from "./src/utils/network";
import { getRpcUrlForNetwork } from "./src/utils/rpc";

// Import services
import { registerAgent } from "./src/services/registerService";
import { generateClientFeedbackAuth } from "./src/services/feedbackService";

// Discovery
import { createDiscoveryCatalogStore } from "./src/discovery/catalog";
import { crawlDiscovery } from "./src/discovery/crawler";

// ============================================================================
// Configuration & Initialization
// ============================================================================

// Initialize the EVM account from private key
const evmAccount = privateKeyToAccount(FACILITATOR_PRIVATE_KEY as `0x${string}`);
console.log("facilitator address:", evmAccount.address);

// Create a Viem client with both wallet and public capabilities
function createEvmSignerForNetwork(network: string) {
  const rpcUrl = getRpcUrlForNetwork(network);
  const chain = mapX402NetworkToChain(network, rpcUrl);
  if (!chain) throw new Error(`Unsupported EVM network: ${network}`);

  const viemClient = createWalletClient({
    account: evmAccount,
    chain,
    transport: http(rpcUrl),
  }).extend(publicActions);

  return toFacilitatorEvmSigner({
    address: evmAccount.address,
    readContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args?: readonly unknown[];
    }) =>
      viemClient.readContract({
        ...args,
        args: args.args || [],
      }),
    verifyTypedData: (args: {
      address: `0x${string}`;
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
      signature: `0x${string}`;
    }) => viemClient.verifyTypedData(args as any),
    writeContract: (args: {
      address: `0x${string}`;
      abi: readonly unknown[];
      functionName: string;
      args: readonly unknown[];
    }) =>
      viemClient.writeContract({
        ...args,
        args: args.args || [],
      }),
    waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
      viemClient.waitForTransactionReceipt(args),
  });
}

// Initialize facilitator and register schemes
const facilitator = new x402Facilitator();

facilitator.register("eip155:84532", new ExactEvmScheme(createEvmSignerForNetwork("eip155:84532")));
facilitator.register("eip155:8453", new ExactEvmScheme(createEvmSignerForNetwork("eip155:8453")));

const discoveryCatalogPromise = DISCOVERY_CATALOG_PATH
  ? createDiscoveryCatalogStore(DISCOVERY_CATALOG_PATH)
  : createDiscoveryCatalogStore();

// ============================================================================
// Data Stores
// ============================================================================

// Store client address -> { agentId, feedbackAuth } mapping (for v2)
const feedbackAuthStore = new Map<string, { agentId: string; feedbackAuth: string }>();
// Store agent address -> agentId mapping (for v1)
const agentAddressStore = new Map<string, string>();

// ============================================================================
// Extension Setup
// ============================================================================

// Facilitator-supported extensions
facilitator.registerExtension("discovery");

// Register feedback extension with lifecycle hooks
facilitator.registerExtension("feedback").onAfterSettle(async context => {
  // This hook only handles v2 payments (v1 is handled directly in /settle endpoint)
  const paymentPayload = context.paymentPayload;
  const extensions = paymentPayload.extensions;

  // Extract feedback extension data (v2: { info, schema }, tolerate legacy inline shape)
  const feedbackExt = (extensions as any)?.feedback as
    | { info?: { agentId?: string; feedbackEnabled?: boolean; feedbackAuthEndpoint?: string } }
    | { agentId?: string; feedbackEnabled?: boolean; feedbackAuthEndpoint?: string }
    | undefined;
  const feedbackInfo =
    feedbackExt && typeof feedbackExt === "object" && "info" in feedbackExt
      ? (feedbackExt as any).info
      : feedbackExt;

  // For v2, use agentId from registerInfo if feedbackEnabled is true
  if (!feedbackInfo || !feedbackInfo.agentId || !feedbackInfo.feedbackEnabled) {
    // No feedback enabled for v2, skip
    return;
  }

  // Get client address from payment payload (the payer)
  const clientAddress = (paymentPayload.payload as any)?.authorization?.from;

  if (!clientAddress) {
    console.warn("No client address found in payment payload, skipping feedbackAuth generation");
    return;
  }

  // Get network from payment requirements
  const network = paymentPayload.accepted?.network || "base-sepolia";

  // Get agent URL from resource and feedbackAuthEndpoint from extensions
  const resourceUrl = paymentPayload.resource?.url;
  const feedbackAuthEndpoint = feedbackInfo.feedbackAuthEndpoint || "/signFeedbackAuth";

  // Extract host from resource URL and construct full endpoint URL
  let agentUrl: string | undefined;
  if (resourceUrl) {
    try {
      const url = new URL(resourceUrl);
      agentUrl = `${url.origin}${feedbackAuthEndpoint}`;
    } catch {
      // nothing
    }
  }

  // Generate feedbackAuth for v2
  const result = await generateClientFeedbackAuth(
    feedbackInfo.agentId,
    clientAddress as Address,
    network,
    feedbackAuthStore,
    agentUrl,
  );

  if (result.success) {
    console.log(`✅ Generated feedbackAuth for v2 agent ${result.agentId}`);
  } else {
    console.error(`❌ Failed to generate feedbackAuth for v2: ${result.error}`);
  }
});

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();
app.use(express.json());

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /verify
 * Verify a payment against requirements
 *
 * Note: Payment tracking and bazaar discovery are handled by lifecycle hooks
 */
app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body as {
      paymentPayload: PaymentPayload | LegacyPaymentPayload;
      paymentRequirements: PaymentRequirements | LegacyPaymentRequirements;
    };

    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({
        error: "Missing paymentPayload or paymentRequirements",
      });
    }

    // Check x402Version to determine which verify function to use
    const x402VersionRaw = (paymentPayload as any).x402Version;
    const x402Version =
      typeof x402VersionRaw === "string" ? Number.parseInt(x402VersionRaw, 10) : x402VersionRaw;

    if (x402Version === 1) {
      // Use legacy verify for v1
      console.log("Using legacy verify for x402Version 1");

      const legacyPayload = paymentPayload as LegacyPaymentPayload;
      const legacyRequirements = paymentRequirements as LegacyPaymentRequirements;

      // Get network from requirements (v1 format)
      const network = legacyRequirements.network;
      const rpcUrl = getRpcUrlForNetwork(network);
      const chain = mapX402NetworkToChain(network, rpcUrl);

      if (!chain) {
        return res.status(400).json({
          isValid: false,
          invalidReason: "invalid_scheme" as any, // Type assertion needed due to strict error enum
        } as LegacyVerifyResponse);
      }

      const response: LegacyVerifyResponse = await legacyVerify(legacyPayload, legacyRequirements);

      return res.json(response);
    } else if (x402Version === 2) {
      // Use current facilitator verify for v2
      console.log("Using x402 v2 for verify");

      const reqs = paymentRequirements as PaymentRequirements;
      // Reject unresolved payTo roles for EVM until we implement payTo resolution.
      if (reqs.network.startsWith("eip155:") && reqs.payTo === "merchant") {
        return res.status(400).json({
          isValid: false,
          invalidReason: "unsupported_payto_role",
        } satisfies VerifyResponse);
      }
      if (reqs.network.startsWith("eip155:") && !isAddress(reqs.asset)) {
        return res.status(400).json({
          isValid: false,
          invalidReason: "invalid_asset",
        } satisfies VerifyResponse);
      }
      if (reqs.network.startsWith("eip155:") && !isAddress(reqs.payTo)) {
        return res.status(400).json({
          isValid: false,
          invalidReason: "invalid_payto",
        } satisfies VerifyResponse);
      }

      const response: VerifyResponse = await facilitator.verify(
        paymentPayload as PaymentPayload,
        reqs,
      );

      return res.json(response);
    } else {
      return res.status(400).json({
        error: `Unsupported x402Version: ${x402Version}`,
      });
    }
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /settle
 * Settle a payment on-chain
 *
 * Note: Verification validation and cleanup are handled by lifecycle hooks
 */
app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body as {
      paymentPayload: PaymentPayload | LegacyPaymentPayload;
      paymentRequirements: PaymentRequirements | LegacyPaymentRequirements;
    };

    if (!paymentPayload || !paymentRequirements) {
      return res.status(400).json({
        error: "Missing paymentPayload or paymentRequirements",
      });
    }

    // Check x402Version to determine which settle function to use
    const x402VersionRaw = (paymentPayload as any).x402Version;
    const x402Version =
      typeof x402VersionRaw === "string" ? Number.parseInt(x402VersionRaw, 10) : x402VersionRaw;

    if (x402Version === 1) {
      // Use legacy settle for v1
      console.log("Using legacy settle for x402Version 1");

      if (!FACILITATOR_PRIVATE_KEY) {
        return res.status(500).json({
          success: false,
          errorReason: "invalid_scheme" as any, // Type assertion needed due to strict error enum
          network: (paymentRequirements as LegacyPaymentRequirements).network,
          transaction: "",
        } as LegacySettleResponse);
      }

      const legacyPayload = paymentPayload as LegacyPaymentPayload;
      const legacyRequirements = paymentRequirements as LegacyPaymentRequirements;

      // Get network from requirements (v1 format)
      const network = legacyRequirements.network;
      const rpcUrl = getRpcUrlForNetwork(network);
      const chain = mapX402NetworkToChain(network, rpcUrl);

      if (!chain) {
        return res.status(400).json({
          success: false,
          errorReason: "invalid_scheme" as any, // Type assertion needed due to strict error enum
          network,
          transaction: "",
        } as LegacySettleResponse);
      }

      const response: LegacySettleResponse = await legacySettle(legacyPayload, legacyRequirements);
      // TODO: not generating feedbackAuth for v1 after successful settlement

      return res.json(response);
    } else if (x402Version === 2) {
      // Use current facilitator settle for v2
      console.log("Using x402 v2 for settle");

      const reqs = paymentRequirements as PaymentRequirements;
      // Reject unresolved payTo roles for EVM until we implement payTo resolution.
      if (reqs.network.startsWith("eip155:") && reqs.payTo === "merchant") {
        return res.json({
          success: false,
          errorReason: "unsupported_payto_role",
          network: reqs.network,
          transaction: "",
        } satisfies SettleResponse);
      }

      // Hooks will automatically:
      // - Validate payment was verified (onBeforeSettle - will abort if not)
      // - Check verification timeout (onBeforeSettle)
      // - Clean up tracking (onAfterSettle / onSettleFailure)
      const response: SettleResponse = await facilitator.settle(
        paymentPayload as PaymentPayload,
        reqs,
      );

      return res.json(response);
    } else {
      return res.status(400).json({
        success: false,
        errorReason: "invalid_scheme" as any, // Type assertion needed due to strict error enum
        network: (paymentRequirements as any).network || "base-sepolia",
        transaction: "",
      } as LegacySettleResponse);
    }
  } catch (error) {
    console.error("Settle error:", error);

    // Check if this was an abort from hook (v2 only)
    if (error instanceof Error && error.message.includes("Settlement aborted:")) {
      // Return a proper SettleResponse instead of 500 error
      return res.json({
        success: false,
        errorReason: error.message.replace("Settlement aborted: ", ""),
        network: req.body?.paymentPayload?.network || "unknown",
      } as SettleResponse);
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /register
 * Register a new agent with ERC-8004
 * COMMENTED OUT FOR TESTING - Use /register-test instead
 */
app.post("/register", async (req, res) => {
  try {
    const {
      tokenURI,
      metadata,
      network = "base-sepolia",
      x402Version = 1,
      agentAddress,
      authorization,
    } = req.body;

    // For v1, agentAddress and authorization are required
    if (x402Version === 1) {
      if (!agentAddress) {
        return res.status(400).json({
          success: false,
          error: "agentAddress is required for x402Version 1",
        });
      }
      if (!authorization) {
        return res.status(400).json({
          success: false,
          error: "authorization is required for x402Version 1 (EIP-7702)",
        });
      }
    }

    // Deserialize authorization - convert string values back to BigInt for viem
    // Note: viem's Authorization type expects numbers, but EIP-7702 uses BigInt
    // We'll use type assertion since the values are correct at runtime
    const deserializedAuthorization = {
      chainId: BigInt((authorization as any).chainId),
      address: (authorization as any).address as Address,
      nonce: BigInt((authorization as any).nonce),
      yParity: (authorization as any).yParity as 0 | 1,
      r: (authorization as any).r as `0x${string}`,
      s: (authorization as any).s as `0x${string}`,
    } as unknown as Authorization;

    const result = await registerAgent({
      agentAddress: agentAddress as Address,
      authorization: deserializedAuthorization,
      tokenURI,
      metadata,
      network,
    });

    if (result.success && result.agentId) {
      // For v1, store agentAddress -> agentId mapping
      if (x402Version === 1 && agentAddress) {
        agentAddressStore.set(agentAddress.toLowerCase(), result.agentId);
        console.log(
          `📝 Stored v1 agentAddress (${agentAddress}) -> agentId (${result.agentId}) mapping`,
        );
      }

      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /supported
 * Get supported payment kinds and extensions
 */
app.get("/supported", async (req, res) => {
  try {
    const supported = facilitator.getSupported();

    // Add explicit V1 compatibility kinds (legacy network identifiers)
    const kinds: SupportedResponse["kinds"] = {
      ...supported.kinds,
      "1": [
        { scheme: "exact", network: "base-sepolia" as any },
        { scheme: "exact", network: "base" as any },
      ],
    };

    const response: SupportedResponse = {
      kinds,
      extensions: supported.extensions,
      signers: supported.signers,
    };

    console.log("Returning supported schemes:", response);
    res.json(response);
  } catch (error) {
    console.error("Supported error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /catalog
 * Returns the current discovery catalog snapshot.
 */
app.get("/catalog", async (req, res) => {
  try {
    const store = await discoveryCatalogPromise;
    const full = (req.query as any)?.full === "1" || (req.query as any)?.full === "true";
    const entries = store.list();

    if (full) {
      return res.json({ count: entries.length, entries });
    }

    return res.json({
      count: entries.length,
      entries: entries.map(entry => ({
        resourceUrl: entry.resourceUrl,
        sourceUrl: entry.sourceUrl,
        lastSeenAt: entry.lastSeenAt,
        accepts: entry.paymentRequired.accepts,
        extensions: Object.keys(entry.paymentRequired.extensions ?? {}),
      })),
    });
  } catch (error) {
    console.error("Catalog error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /discover
 * On-demand discovery crawl.
 */
app.post("/discover", async (req, res) => {
  try {
    const { seedUrls, maxDepth, maxRequests, timeoutMs } = (req.body ?? {}) as {
      seedUrls?: unknown;
      maxDepth?: unknown;
      maxRequests?: unknown;
      timeoutMs?: unknown;
    };

    if (!Array.isArray(seedUrls) || seedUrls.some(u => typeof u !== "string")) {
      return res.status(400).json({
        error: "seedUrls must be an array of URL strings",
      });
    }

    const store = await discoveryCatalogPromise;
    const result = await crawlDiscovery(store, {
      seedUrls,
      maxDepth: typeof maxDepth === "number" ? Math.min(Math.max(0, maxDepth), 5) : undefined,
      maxRequests:
        typeof maxRequests === "number" ? Math.min(Math.max(1, maxRequests), 500) : undefined,
      timeoutMs:
        typeof timeoutMs === "number" ? Math.min(Math.max(1000, timeoutMs), 60_000) : undefined,
    });

    res.json({
      ...result,
      catalogCount: store.list().length,
    });
  } catch (error) {
    console.error("Discover error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    networks: ["eip155:84532", "eip155:8453"],
    facilitator: "typescript",
    version: "2.0.0",
    extensions: facilitator.getExtensions(),
  });
});

/**
 * POST /close
 * Graceful shutdown endpoint
 */
app.post("/close", (req, res) => {
  res.json({ message: "Facilitator shutting down gracefully" });
  console.log("Received shutdown request");

  // Give time for response to be sent
  setTimeout(() => {
    process.exit(0);
  }, 100);
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(parseInt(PORT), () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           x402 TypeScript Facilitator                  ║
╠════════════════════════════════════════════════════════╣
║  Networks:   eip155:84532, eip155:8453                 ║
║  Extensions: discovery, feedback                       ║
║                                                        ║
║  Endpoints:                                            ║
║  • POST /verify              (verify payment)          ║
║  • POST /settle              (settle payment)          ║
║  • GET  /supported           (get supported kinds)     ║
║  • POST /discover            (crawl discovery)         ║
║  • GET  /catalog             (discovery catalog)       ║
║  • GET  /health              (health check)            ║
║  • POST /close               (shutdown server)         ║
║  • POST /register            (register agent)          ║
╚════════════════════════════════════════════════════════╝
  `);

  // Log that facilitator is ready (needed for e2e test discovery)
  console.log("Facilitator listening");

  if (DISCOVERY_ENABLED && DISCOVERY_SEEDS.length > 0) {
    const intervalSeconds =
      Number.isFinite(DISCOVERY_INTERVAL_SECONDS) && DISCOVERY_INTERVAL_SECONDS > 0
        ? DISCOVERY_INTERVAL_SECONDS
        : 300;
    const maxDepth =
      Number.isFinite(DISCOVERY_MAX_DEPTH) && DISCOVERY_MAX_DEPTH >= 0 ? DISCOVERY_MAX_DEPTH : 2;
    const maxRequests =
      Number.isFinite(DISCOVERY_MAX_REQUESTS) && DISCOVERY_MAX_REQUESTS > 0
        ? DISCOVERY_MAX_REQUESTS
        : 50;
    const timeoutMs =
      Number.isFinite(DISCOVERY_TIMEOUT_MS) && DISCOVERY_TIMEOUT_MS > 0 ? DISCOVERY_TIMEOUT_MS : 10_000;

    console.log(
      `🔎 Discovery enabled: seeds=${DISCOVERY_SEEDS.length} interval=${intervalSeconds}s maxDepth=${maxDepth} maxRequests=${maxRequests}`,
    );

    let isRunning = false;
    const runOnce = async () => {
      const store = await discoveryCatalogPromise;
      const result = await crawlDiscovery(store, {
        seedUrls: DISCOVERY_SEEDS,
        maxDepth,
        maxRequests,
        timeoutMs,
      });
      console.log(
        `🔎 Discovery crawl done: visited=${result.visited} stored=${result.stored} errors=${result.errors.length}`,
      );
      if (result.errors.length > 0) console.warn("Discovery crawl errors:", result.errors);
    };

    // Run immediately, then schedule
    runOnce().catch(err => console.error("Discovery crawl failed:", err));
    setInterval(() => {
      if (isRunning) return;
      isRunning = true;
      runOnce()
        .catch(err => console.error("Discovery crawl failed:", err))
        .finally(() => {
          isRunning = false;
        });
    }, intervalSeconds * 1000);
  }
});
