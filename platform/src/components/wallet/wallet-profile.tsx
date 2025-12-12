"use client";

import * as React from "react";
import { Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { WalletConnector } from "~/components/wallet/wallet-connector";
import { cn } from "~/lib/utils";
import { clearWalletState, useWalletStore } from "~/lib/wallet-store";

interface WalletProfileProps {
  className?: string;
}

function truncateAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletProfile({ className }: WalletProfileProps) {
  const { account, chainId } = useWalletStore();

  const basescanHref = React.useMemo(() => {
    if (!account) return null;
    return `https://basescan.org/address/${account}`;
  }, [account]);

  async function copyAddress() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      toast.success("Address copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function disconnect() {
    clearWalletState();
    toast.message("Disconnected");
  }

  if (!account) {
    return (
      <div
        className={cn(
          "w-full rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-muted-foreground" />
          <div className="text-sm font-semibold">Wallet</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Connect a wallet on Base to redeem Animata passes.
        </p>
        <div className="mt-3">
          <WalletConnector size="lg" className="w-full justify-center" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-9 bg-muted">
          <AvatarFallback className="text-[10px] font-extrabold uppercase text-muted-foreground">
            {account.slice(2, 4)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {truncateAddress(account)}
          </div>
          <div className="text-xs text-muted-foreground">
            Base{chainId ? ` • ${chainId}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" onClick={copyAddress} title="Copy">
          <Copy className="size-4" />
          <span className="sr-only">Copy address</span>
        </Button>

        <Button variant="outline" size="sm" asChild title="View on Basescan">
          <a
            href={basescanHref ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
            <span className="sr-only">View on Basescan</span>
          </a>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={disconnect}
          title="Disconnect"
        >
          <LogOut className="size-4" />
          <span className="sr-only">Disconnect</span>
        </Button>
      </div>
    </div>
  );
}


