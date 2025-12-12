"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { base } from "viem/chains";
import { createWalletClient, custom } from "viem";
import { setWalletState, useWalletStore } from "@/lib/wallet-store";
import { env } from "~/env/client";
import { cn } from "~/lib/utils";

interface WalletConnectorProps {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
}

export function WalletConnector({
  className,
  size = "lg",
  variant = "outline",
}: WalletConnectorProps) {
  const { account } = useWalletStore();
  const [connecting, setConnecting] = React.useState(false);

  async function connect() {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      return;
    }
    setConnecting(true);
    try {
      const wc = createWalletClient({
        chain: base,
        transport: custom((window as any).ethereum),
      });
      const [addr] = (await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      try {
        // Ensure Base chain configured with the desired RPC from env
        const rpcUrl = env.BASE_RPC_URL;
        if (rpcUrl) {
          try {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x2105", // 8453
                  chainName: "Base",
                  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                  rpcUrls: [rpcUrl],
                  blockExplorerUrls: ["https://basescan.org"],
                },
              ],
            });
          } catch {
            // ignore add errors (already added or wallet doesn't support)
          }
        }
        const currentChainId = await wc.getChainId();
        if (currentChainId !== base.id) {
          await wc.switchChain({ id: base.id });
        }
      } catch {
        // ignore switch errors; user may reject
      }
      setWalletState({
        account: addr as `0x${string}`,
        wallet: wc,
        chainId: base.id,
      });
    } finally {
      setConnecting(false);
    }
  }

  const connectLabel = size === "lg" ? "Connect Wallet" : "Connect";
  const connectingLabel = size === "lg" ? "Connecting..." : "Connecting...";
  const label = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : connecting
      ? connectingLabel
      : connectLabel;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "select-none rounded-lg active:scale-[.98]",
        size === "lg" ? "min-h-[48px] px-5 py-3 text-base sm:px-6 sm:py-2 md:text-lg" : "",
        className
      )}
      style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
      aria-label="Connect Wallet"
      type="button"
      onClick={connect}
      title={account ?? "Connect"}
    >
      {label}
    </Button>
  );
}
