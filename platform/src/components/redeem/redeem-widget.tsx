"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { base } from "viem/chains";
import {
  createWalletClient,
  custom,
  createPublicClient,
  http,
  type WalletClient,
  type Hex,
  formatUnits,
} from "viem";
import {
  ANIMATA1,
  ANIMATA2,
  USDC,
  REGENT,
  COLLECTION3,
  USDC_PRICE,
  erc721Abi,
  erc20Abi,
  redeemerAbi,
  REGENT_PAYOUT,
} from "@/lib/redeem-constants";
import {
  PermitTransferFromTypes,
  permit2Domain,
  type PermitTransferFrom,
} from "@/lib/permit2";
import { env } from "~/env/client";
import { setWalletState, useWalletStore } from "@/lib/wallet-store";

interface RedeemWidgetProps {
  variant?: "full" | "simple";
}

type SourceKey = "ANIMATA1" | "ANIMATA2";

interface HoldingList {
  animata1: number[];
  animata2: number[];
}

interface HoldingsFetched {
  ANIMATA1: boolean;
  ANIMATA2: boolean;
}

function getSourceAddress(key: SourceKey): `0x${string}` {
  return key === "ANIMATA1" ? ANIMATA1 : ANIMATA2;
}

function getSourceSlug(key: SourceKey): "animata" | "regent-animata-ii" {
  return key === "ANIMATA1" ? "animata" : "regent-animata-ii";
}

function makeNonce(): bigint {
  const rand = Math.floor(Math.random() * 1e9);
  const now = Date.now();
  const mixed = (BigInt(rand) << BigInt(64)) | BigInt(now);
  return mixed;
}

function getReadableError(e: unknown): string {
  try {
    const anyErr = e as any;
    const msg =
      anyErr?.shortMessage ??
      anyErr?.cause?.shortMessage ??
      anyErr?.message ??
      anyErr?.cause?.message;
    if (msg) return String(msg);
    return typeof e === "string" ? e : JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function formatRegentRounded2(amount: bigint): string {
  const denom = 10n ** 18n;
  const scaled = amount * 100n;
  const cents = (scaled + denom / 2n) / denom;
  const whole = cents / 100n;
  const frac = cents % 100n;
  function addCommas(n: string): string {
    let s = n;
    let sign = "";
    if (s.startsWith("-")) {
      sign = "-";
      s = s.slice(1);
    }
    const parts: string[] = [];
    for (let i = s.length; i > 0; i -= 3) {
      const start = Math.max(0, i - 3);
      parts.unshift(s.slice(start, i));
    }
    return sign + parts.join(",");
  }
  return `${addCommas(whole.toString())}.${frac.toString().padStart(2, "0")}`;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function RedeemWidget({ variant = "simple" }: RedeemWidgetProps) {
  const [wallet, setWallet] = React.useState<WalletClient | null>(null);
  const [account, setAccount] = React.useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [source, setSource] = React.useState<SourceKey>("ANIMATA1");
  const [tokenId, setTokenId] = React.useState<string>("");
  const [status, setStatus] = React.useState<
    "idle" | "connecting" | "approving" | "redeeming" | "fetching" | "claiming"
  >("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [holdings, setHoldings] = React.useState<HoldingList | null>(null);
  const [isFetchingHoldings, setIsFetchingHoldings] =
    React.useState<boolean>(false);
  const [holdingsFetched, setHoldingsFetched] = React.useState<HoldingsFetched>({
    ANIMATA1: false,
    ANIMATA2: false,
  });
  const [accessPassHoldings, setAccessPassHoldings] = React.useState<
    number[] | null
  >(null);
  const [accessPassError, setAccessPassError] = React.useState<string | null>(
    null
  );
  const [isFetchingAccessPassHoldings, setIsFetchingAccessPassHoldings] =
    React.useState<boolean>(false);
  const [claimable, setClaimable] = React.useState<bigint | null>(null);
  const [remaining, setRemaining] = React.useState<bigint | null>(null);
  const [nftApproved, setNftApproved] = React.useState<boolean>(false);
  const [usdcAllowanceOk, setUsdcAllowanceOk] = React.useState<boolean>(false);
  const [usdcBalanceOk, setUsdcBalanceOk] = React.useState<boolean>(false);
  const [c3Available, setC3Available] = React.useState<boolean>(false);
  const [regentFunded, setRegentFunded] = React.useState<boolean>(false);
  const [ownsSelectedToken, setOwnsSelectedToken] = React.useState<
    boolean | null
  >(null);
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);
  const [successTotal, setSuccessTotal] = React.useState<bigint | null>(null);

  const publicClient = React.useMemo(
    () =>
      createPublicClient({
        chain: base,
        transport: http(env.BASE_RPC_URL),
      }),
    []
  );

  const redeemerAddress = React.useMemo(() => {
    const addr = env.VITE_NEXT_PUBLIC_REDEEMER_ADDRESS;
    return (addr?.toLowerCase() as `0x${string}` | undefined) ?? undefined;
  }, []);

  const sharedWallet = useWalletStore();
  const latestHoldingsParamsRef = React.useRef<{
    account: `0x${string}` | null;
    source: SourceKey;
  }>({ account: null, source });
  latestHoldingsParamsRef.current = { account: sharedWallet.account, source };

  const holdingsWantedKeyRef = React.useRef<string | null>(null);
  const holdingsInFlightKeyRef = React.useRef<string | null>(null);
  const ownershipKeyRef = React.useRef<string | null>(null);
  const accessPassWantedKeyRef = React.useRef<string | null>(null);
  const accessPassInFlightKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (wallet !== sharedWallet.wallet) setWallet(sharedWallet.wallet);
    if (account !== sharedWallet.account) setAccount(sharedWallet.account);
    if (chainId !== sharedWallet.chainId) setChainId(sharedWallet.chainId);
  }, [sharedWallet.wallet, sharedWallet.account, sharedWallet.chainId]);

  React.useEffect(() => {
    const acc = account ?? sharedWallet.account;
    if (!redeemerAddress || !acc) return;
    void (async () => {
      try {
        const c = (await publicClient.readContract({
          address: redeemerAddress,
          abi: redeemerAbi,
          functionName: "claimable",
          args: [acc],
        })) as bigint;
        setClaimable(c);
        try {
          const [pool, released, claimed] = (await publicClient.readContract({
            address: redeemerAddress,
            abi: redeemerAbi,
            functionName: "getVest",
            args: [acc],
          })) as readonly [bigint, bigint, bigint, bigint];
          const outstanding = pool + released - claimed;
          setRemaining(outstanding < 0n ? 0n : outstanding);
        } catch {}
      } catch {}
    })();
  }, [redeemerAddress, account, sharedWallet.account, publicClient]);

  async function ensureWallet() {
    const existingWallet = wallet ?? sharedWallet.wallet;
    const existingAccount = account ?? sharedWallet.account;
    const existingChainId = chainId ?? sharedWallet.chainId;
    if (existingWallet && existingAccount && existingChainId === base.id)
      return;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No injected wallet found (e.g., MetaMask).");
    }
    setStatus("connecting");
    try {
      const wc = createWalletClient({
        chain: base,
        transport: custom((window as any).ethereum),
      });
      const [addr] = (await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setWallet(wc);
      setAccount(addr as `0x${string}`);
      const currentChainId = await wc.getChainId();
      if (currentChainId !== base.id) {
        await wc.switchChain({ id: base.id });
        setChainId(base.id);
      } else {
        setChainId(currentChainId);
      }
      setWalletState({
        account: addr as `0x${string}`,
        wallet: wc,
        chainId: base.id,
      });
      if (redeemerAddress) {
        try {
          const c = (await publicClient.readContract({
            address: redeemerAddress,
            abi: redeemerAbi,
            functionName: "claimable",
            args: [addr as `0x${string}`],
          })) as bigint;
          setClaimable(c);
        } catch {}
      }
    } finally {
      setStatus("idle");
    }
  }

  async function ensureNftApproval() {
    if (!wallet || !account) throw new Error("Connect wallet first.");
    const collection = getSourceAddress(source);
    const approved = (await publicClient.readContract({
      address: collection,
      abi: erc721Abi,
      functionName: "isApprovedForAll",
      args: [account, redeemerAddress!],
    })) as boolean;
    setNftApproved(approved);
    if (approved) return;
    setStatus("approving");
    try {
      const hash = await wallet.writeContract({
        address: collection,
        abi: erc721Abi,
        functionName: "setApprovalForAll",
        args: [redeemerAddress!, true],
        account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setNftApproved(true);
    } finally {
      setStatus("idle");
    }
  }

  async function approveUSDC() {
    setError(null);
    if (!wallet || !account) throw new Error("Connect wallet first.");
    setStatus("approving");
    try {
      const hash = await wallet.writeContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "approve",
        args: [redeemerAddress!, USDC_PRICE],
        account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setUsdcAllowanceOk(true);
    } catch (e) {
      setError(getReadableError(e));
    } finally {
      setStatus("idle");
    }
  }

  async function redeemClassic() {
    setError(null);
    try {
      await ensureWallet();
      if (!wallet || !account) throw new Error("Wallet not ready.");
      let beforeOutstanding: bigint | null = null;
      try {
        const [poolB, releasedB, claimedB] = (await publicClient.readContract({
          address: redeemerAddress!,
          abi: redeemerAbi,
          functionName: "getVest",
          args: [account],
          blockTag: "latest",
        })) as readonly [bigint, bigint, bigint, bigint];
        beforeOutstanding = poolB + releasedB - claimedB;
      } catch {}
      const tid = BigInt(tokenId);
      if (tid < BigInt(1) || tid > BigInt(999))
        throw new Error("Token ID must be 1-999.");
      await ensureNftApproval();
      const allowance = (await publicClient.readContract({
        address: USDC,
        abi: erc20Abi,
        functionName: "allowance",
        args: [account, redeemerAddress!],
      })) as bigint;
      if (allowance < USDC_PRICE) throw new Error("Approve USDC for 80 first.");
      try {
        await publicClient.simulateContract({
          address: redeemerAddress!,
          abi: redeemerAbi,
          functionName: "redeem",
          args: [getSourceAddress(source), tid],
          account,
          chain: base,
        });
      } catch (simErr) {
        throw new Error(getReadableError(simErr));
      }
      setStatus("redeeming");
      const hash = await wallet.writeContract({
        address: redeemerAddress!,
        abi: redeemerAbi,
        functionName: "redeem",
        args: [getSourceAddress(source), tid],
        account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      // Redeem transfers the Animata NFT; refresh holdings so chips update.
      void fetchHoldings();
      void fetchAccessPassHoldings();
      await refreshClaimable();
      try {
        let attempts = 0;
        let outstanding = 0n;
        while (attempts < 8) {
          const [pool, released, claimed] = (await publicClient.readContract({
            address: redeemerAddress!,
            abi: redeemerAbi,
            functionName: "getVest",
            args: [account],
            blockTag: "latest",
          })) as readonly [bigint, bigint, bigint, bigint];
          outstanding = pool + released - claimed;
          if (
            beforeOutstanding === null ||
            outstanding >= beforeOutstanding + REGENT_PAYOUT
          )
            break;
          attempts += 1;
          await sleep(1000);
        }
        setSuccessTotal(outstanding < 0n ? 0n : outstanding);
        setShowSuccess(true);
      } catch {}
      // Keep the loading state until the success modal is ready.
      setStatus("idle");
    } catch (e) {
      setStatus("idle");
      setError(getReadableError(e));
    }
  }

  async function runPrechecks() {
    if (!redeemerAddress || !account) return;
    try {
      const tid = /^\d+$/.test(tokenId) ? BigInt(tokenId) : BigInt(0);
      const newId = source === "ANIMATA1" ? tid : tid + BigInt(999);
      const [ownerC3, regentBal, usdcBal, allowance, approved] =
        await Promise.all([
          tid >= BigInt(1) && tid <= BigInt(999)
            ? publicClient
                .readContract({
                  address: COLLECTION3,
                  abi: [
                    {
                      type: "function",
                      name: "ownerOf",
                      stateMutability: "view",
                      inputs: [{ name: "tokenId", type: "uint256" }],
                      outputs: [{ name: "", type: "address" }],
                    },
                  ] as const,
                  functionName: "ownerOf",
                  args: [newId],
                })
                .catch(() => null)
            : Promise.resolve(null),
          publicClient.readContract({
            address: REGENT,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [redeemerAddress],
          }),
          publicClient.readContract({
            address: USDC,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [account],
          }),
          publicClient.readContract({
            address: USDC,
            abi: erc20Abi,
            functionName: "allowance",
            args: [account, redeemerAddress],
          }),
          publicClient.readContract({
            address: getSourceAddress(source),
            abi: erc721Abi,
            functionName: "isApprovedForAll",
            args: [account, redeemerAddress],
          }),
        ]);
      setC3Available(
        ownerC3?.toString().toLowerCase() === redeemerAddress.toLowerCase()
      );
      setRegentFunded((regentBal as bigint) >= REGENT_PAYOUT);
      setUsdcBalanceOk((usdcBal as bigint) >= USDC_PRICE);
      setUsdcAllowanceOk((allowance as bigint) >= USDC_PRICE);
      setNftApproved(approved as boolean);
    } catch {}
  }

  async function refreshClaimable() {
    const acc = account ?? sharedWallet.account;
    if (!redeemerAddress || !acc) return;
    try {
      const c = (await publicClient.readContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "claimable",
        args: [acc],
      })) as bigint;
      setClaimable(c);
      try {
        const [pool, released, claimed] = (await publicClient.readContract({
          address: redeemerAddress,
          abi: redeemerAbi,
          functionName: "getVest",
          args: [acc],
        })) as readonly [bigint, bigint, bigint, bigint];
        const outstanding = pool + released - claimed;
        setRemaining(outstanding < 0n ? 0n : outstanding);
      } catch {}
    } catch {}
  }

  async function claimRegent() {
    setError(null);
    if (!redeemerAddress) return;
    try {
      await ensureWallet();
      if (!wallet || !account) throw new Error("Wallet not ready.");
      setStatus("claiming");
      const hash = await wallet.writeContract({
        address: redeemerAddress,
        abi: redeemerAbi,
        functionName: "claim",
        args: [],
        account,
        chain: base,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await refreshClaimable();
      // Keep the UI consistent after on-chain state changes.
      void fetchHoldings();
    } catch (e: unknown) {
      setError(getReadableError(e));
    } finally {
      setStatus("idle");
    }
  }

  async function fetchAccessPassHoldings() {
    const connected = sharedWallet.account ?? account;
    if (!connected) return;

    const desiredKey = `${connected}:animata-pass`;
    accessPassWantedKeyRef.current = desiredKey;
    if (accessPassInFlightKeyRef.current) return;

    accessPassInFlightKeyRef.current = desiredKey;
    setIsFetchingAccessPassHoldings(true);
    setAccessPassError(null);
    try {
      const res = await fetch(
        `/api/opensea?address=${connected}&collection=animata-pass`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const text = await res.text();
        const isHtml =
          (res.headers.get("content-type") ?? "").includes("text/html") ||
          text.trimStart().startsWith("<!DOCTYPE html");
        if (
          res.status === 404 ||
          text.includes("Cannot GET /api/opensea") ||
          isHtml
        ) {
          throw new Error(
            "Access pass holdings lookup is unavailable (missing GET /api/opensea)."
          );
        }
        if (
          res.status === 500 &&
          text.toLowerCase().includes("opensea_api_key")
        ) {
          throw new Error(
            "Access pass holdings are unavailable (server missing OPENSEA_API_KEY)."
          );
        }
        throw new Error(`Access pass holdings lookup failed: ${text}`);
      }

      const data = (await res.json()) as { animataPass?: number[] };
      if (accessPassWantedKeyRef.current !== desiredKey) return;

      setAccessPassHoldings(
        Array.isArray(data.animataPass) ? data.animataPass : []
      );
    } catch (e: unknown) {
      setAccessPassError((e as Error)?.message ?? String(e));
    } finally {
      accessPassInFlightKeyRef.current = null;
      setIsFetchingAccessPassHoldings(false);
      const nextKey = accessPassWantedKeyRef.current;
      if (nextKey && nextKey !== desiredKey) void fetchAccessPassHoldings();
    }
  }

  async function fetchHoldings() {
    const { account: connected, source: sourceForFetch } =
      latestHoldingsParamsRef.current;
    if (!connected) {
      setError("Connect wallet first.");
      return;
    }

    const desiredKey = `${connected}:${sourceForFetch}`;
    holdingsWantedKeyRef.current = desiredKey;
    if (holdingsInFlightKeyRef.current) return;

    holdingsInFlightKeyRef.current = desiredKey;
    setIsFetchingHoldings(true);
    setError(null);
    try {
      const slug = getSourceSlug(sourceForFetch);
      const res = await fetch(
        `/api/opensea?address=${connected}&collection=${slug}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const text = await res.text();
        const isHtml =
          (res.headers.get("content-type") ?? "").includes("text/html") ||
          text.trimStart().startsWith("<!DOCTYPE html");
        if (res.status === 404 || text.includes("Cannot GET /api/opensea") || isHtml) {
          throw new Error(
            "Holdings lookup endpoint is unavailable (missing GET /api/opensea). You can still redeem by manually entering a token ID."
          );
        }
        if (res.status === 500 && text.toLowerCase().includes("opensea_api_key")) {
          throw new Error(
            "Holdings lookup is unavailable (server missing OPENSEA_API_KEY). You can still redeem by manually entering a token ID."
          );
        }
        throw new Error(`Holdings lookup failed: ${text}`);
      }
      const data = (await res.json()) as {
        animata1: number[];
        animata2: number[];
      };
      if (holdingsWantedKeyRef.current !== desiredKey) return;
      setHoldings((prev) => {
        const prev1 = prev?.animata1 ?? [];
        const prev2 = prev?.animata2 ?? [];
        return {
          animata1:
            slug === "animata"
              ? Array.isArray(data.animata1)
                ? data.animata1
                : []
              : prev1,
          animata2:
            slug === "regent-animata-ii"
              ? Array.isArray(data.animata2)
                ? data.animata2
                : []
              : prev2,
        };
      });
      setHoldingsFetched((prev) => ({ ...prev, [sourceForFetch]: true }));
    } catch (e: unknown) {
      setError((e as Error)?.message ?? String(e));
    } finally {
      holdingsInFlightKeyRef.current = null;
      setIsFetchingHoldings(false);
      const nextKey = holdingsWantedKeyRef.current;
      if (nextKey && nextKey !== desiredKey) void fetchHoldings();
    }
  }

  const holdingsAccountRef = React.useRef<`0x${string}` | null>(null);
  React.useEffect(() => {
    // Refresh holdings on wallet change or source change.
    const connected = sharedWallet.account;
    if (connected !== holdingsAccountRef.current) {
      holdingsAccountRef.current = connected;
      setHoldings(null);
      setHoldingsFetched({ ANIMATA1: false, ANIMATA2: false });
      setOwnsSelectedToken(null);
    }
    if (!connected) return;
    void fetchHoldings();
  }, [sharedWallet.account, source]);

  const accessPassAccountRef = React.useRef<`0x${string}` | null>(null);
  React.useEffect(() => {
    const connected = sharedWallet.account ?? account;
    if (connected !== accessPassAccountRef.current) {
      accessPassAccountRef.current = connected;
      setAccessPassHoldings(null);
      setAccessPassError(null);
    }
    if (!connected) return;
    void fetchAccessPassHoldings();
  }, [sharedWallet.account]);

  React.useEffect(() => {
    if (!account && !sharedWallet.account) return;
    void runPrechecks();
  }, [account, sharedWallet.account, source, tokenId]);

  React.useEffect(() => {
    const acc = sharedWallet.account ?? account;
    if (!acc) return;
    if (!/^\d+$/.test(tokenId)) {
      setOwnsSelectedToken(null);
      return;
    }
    const tid = BigInt(tokenId);
    if (tid < 1n || tid > 999n) {
      setOwnsSelectedToken(null);
      return;
    }
    if (holdings && holdingsFetched[source]) {
      const tidNum = Number(tokenId);
      const ids = source === "ANIMATA1" ? holdings.animata1 : holdings.animata2;
      setOwnsSelectedToken(ids.includes(tidNum));
      return;
    }

    const key = `${acc}:${source}:${tokenId}`;
    ownershipKeyRef.current = key;
    setOwnsSelectedToken(null);

    void (async () => {
      try {
        const owner = (await publicClient.readContract({
          address: getSourceAddress(source),
          abi: [
            {
              type: "function",
              name: "ownerOf",
              stateMutability: "view",
              inputs: [{ name: "tokenId", type: "uint256" }],
              outputs: [{ name: "", type: "address" }],
            },
          ] as const,
          functionName: "ownerOf",
          args: [tid],
        })) as `0x${string}`;
        if (ownershipKeyRef.current !== key) return;
        const ok = owner.toLowerCase() === acc.toLowerCase();
        setOwnsSelectedToken(ok);
      } catch {
        if (ownershipKeyRef.current !== key) return;
        // Avoid false negatives on transient RPC errors.
        setOwnsSelectedToken(null);
      }
    })();
  }, [
    account,
    sharedWallet.account,
    source,
    tokenId,
    publicClient,
    holdings,
    holdingsFetched,
  ]);

  const connectedAccount = sharedWallet.account ?? account;
  const tokenIdValid =
    /^\d+$/.test(tokenId) && Number(tokenId) >= 1 && Number(tokenId) <= 999;

  return (
    <div className="w-full space-y-6">
      {/* Collection Selection */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">Select NFT to Redeem</h3>
        <div className="-mt-2 mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <a
            href="https://opensea.io/collection/animata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Animata I <ExternalLink className="size-3" />
          </a>
          <a
            href="https://opensea.io/collection/regent-animata-ii"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Animata II <ExternalLink className="size-3" />
          </a>
          <a
            href="https://opensea.io/collection/animata-pass"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Regent Animata Pass <ExternalLink className="size-3" />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Source Collection
            </label>
            <select
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary"
              value={source}
              onChange={(e) => setSource(e.target.value as SourceKey)}
            >
              <option value="ANIMATA1">Animata I</option>
              <option value="ANIMATA2">Animata II</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">
              Token ID (1-999)
            </label>
            <input
              inputMode="numeric"
              disabled={!connectedAccount}
              className={`w-full rounded-lg border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary ${
                tokenId.length > 0 && !tokenIdValid
                  ? "border-destructive"
                  : "border-border"
              } ${!connectedAccount ? "cursor-not-allowed opacity-50" : ""}`}
              placeholder="e.g. 123"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value.trim())}
            />
            {tokenId.length > 0 && !tokenIdValid && (
              <p className="mt-2 text-sm text-destructive">
                Enter a whole number from 1 to 999.
              </p>
            )}
            {!connectedAccount && (
              <p className="mt-2 text-sm text-muted-foreground">
                Connect your wallet to enter a token ID.
              </p>
            )}
            {connectedAccount && ownsSelectedToken === false && tokenIdValid && (
              <p className="mt-2 text-sm text-destructive">
                You don't own this token in{" "}
                {source === "ANIMATA1" ? "Animata I" : "Animata II"}.
              </p>
            )}
          </div>
        </div>

        {/* NFT Holdings */}
        {connectedAccount && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Your {source === "ANIMATA1" ? "Animata I" : "Animata II"} NFTs
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchHoldings}
                disabled={isFetchingHoldings}
              >
                {isFetchingHoldings ? "Loading..." : "Refresh"}
              </Button>
            </div>
            {holdings && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(source === "ANIMATA1"
                  ? holdings.animata1
                  : holdings.animata2
                ).length === 0 ? (
                  <span className="text-sm text-muted-foreground">None found</span>
                ) : (
                  (source === "ANIMATA1"
                    ? holdings.animata1
                    : holdings.animata2
                  ).map((id) => (
                    <button
                      key={`${source}-${id}`}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                        tokenId === String(id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      }`}
                      onClick={() => setTokenId(String(id))}
                    >
                      #{id}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Approvals & Actions */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">Approvals & Redemption</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Price: 80 USDC - Receive a Collection 3 NFT + 5M REGENT (vested over 7
          days)
        </p>

        <div className="flex flex-wrap gap-3">
          {connectedAccount && !nftApproved && (
            <Button
              variant="outline"
              onClick={ensureNftApproval}
              disabled={status === "approving"}
            >
              {status === "approving" ? "Approving NFT..." : "Approve NFT"}
            </Button>
          )}
          {connectedAccount && !usdcAllowanceOk && (
            <Button
              variant="outline"
              onClick={approveUSDC}
              disabled={status === "approving"}
            >
              {status === "approving" ? "Approving..." : "Approve 80 USDC"}
            </Button>
          )}
          <Button
            onClick={redeemClassic}
            disabled={
              !connectedAccount ||
              !tokenIdValid ||
              ownsSelectedToken === false ||
              !usdcAllowanceOk ||
              status === "redeeming"
            }
            className="bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90"
          >
            {status === "redeeming" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Confirming…
              </span>
            ) : (
              "Redeem for REGENT"
            )}
          </Button>
        </div>
      </div>

      {/* Claimable REGENT */}
      {connectedAccount && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Claimable REGENT</h3>
              <p className="mt-1 font-mono text-2xl">
                {claimable !== null
                  ? formatRegentRounded2(claimable)
                  : "---"}
              </p>
              {remaining !== null && remaining > 0n && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Total remaining:{" "}
                  <span className="font-mono">
                    {formatRegentRounded2(remaining)}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={refreshClaimable}
                disabled={status !== "idle"}
              >
                Refresh
              </Button>
              <Button
                onClick={claimRegent}
                disabled={
                  status === "claiming" || !claimable || claimable === BigInt(0)
                }
                className="bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90"
              >
                {status === "claiming" ? "Claiming..." : "Claim"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-checks */}
      {connectedAccount && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pre-checks</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={runPrechecks}
              disabled={status !== "idle"}
            >
              Refresh
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div
              className={
                c3Available
                  ? "text-chart-2"
                  : "text-muted-foreground"
              }
            >
              C3 ID available
            </div>
            <div
              className={
                regentFunded
                  ? "text-chart-2"
                  : "text-muted-foreground"
              }
            >
              REGENT funded
            </div>
            <div
              className={
                usdcBalanceOk
                  ? "text-chart-2"
                  : "text-muted-foreground"
              }
            >
              USDC balance OK
            </div>
            <div
              className={
                usdcAllowanceOk
                  ? "text-chart-2"
                  : "text-muted-foreground"
              }
            >
              USDC allowance OK
            </div>
            <div
              className={
                nftApproved
                  ? "text-chart-2"
                  : "text-muted-foreground"
              }
            >
              NFT approved
            </div>
          </div>
        </div>
      )}

      {/* Regent Animata Access Pass (separate collection, no redeem logic) */}
      {connectedAccount && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Regent Animata Access Pass
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Base collection (contract {COLLECTION3.slice(0, 6)}…
                {COLLECTION3.slice(-4)})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAccessPassHoldings}
                disabled={isFetchingAccessPassHoldings}
              >
                {isFetchingAccessPassHoldings ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading
                  </span>
                ) : (
                  "Refresh"
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href="https://opensea.io/collection/animata-pass"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenSea <ExternalLink className="ml-2 size-4" />
                </a>
              </Button>
            </div>
          </div>

          {accessPassError && (
            <div className="mt-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {accessPassError}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {accessPassHoldings === null ? (
              <span className="text-sm text-muted-foreground">
                {isFetchingAccessPassHoldings ? "Loading…" : "Not loaded"}
              </span>
            ) : accessPassHoldings.length === 0 ? (
              <span className="text-sm text-muted-foreground">None found</span>
            ) : (
              accessPassHoldings.map((id) => (
                <span
                  key={`animata-pass-${id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm"
                >
                  #{id}
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Redeemer address info */}
      {redeemerAddress ? (
        <p className="text-center text-xs text-muted-foreground">
          Redeemer: {redeemerAddress}
        </p>
      ) : (
        <p className="text-center text-xs text-chart-5">
          Set VITE_NEXT_PUBLIC_REDEEMER_ADDRESS to enable redemption.
        </p>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => {
              void fetchHoldings();
              void fetchAccessPassHoldings();
              setShowSuccess(false);
            }}
          />
          <div className="relative z-[1001] mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h4 className="mb-2 text-2xl font-bold">Success!</h4>
            <p className="text-muted-foreground">
              You now have{" "}
              <span className="font-semibold text-foreground">
                {successTotal !== null
                  ? `${formatRegentRounded2(successTotal)} REGENT`
                  : "---"}
              </span>{" "}
              being streamed to you over 7 days. You can receive any portion of
              it using the Claim button.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  void fetchHoldings();
                  void fetchAccessPassHoldings();
                  setShowSuccess(false);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  void refreshClaimable();
                  void fetchHoldings();
                  void fetchAccessPassHoldings();
                  setShowSuccess(false);
                }}
                className="bg-chart-2 text-chart-2-foreground hover:bg-chart-2/90"
              >
                Check Claimable
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
