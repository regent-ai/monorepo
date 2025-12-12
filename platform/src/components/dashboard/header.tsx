"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  Command,
  MoreVertical,
  Search,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { ThemeToggle } from "~/components/theme-toggle";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { WalletConnector } from "~/components/wallet/wallet-connector";

export function DashboardHeader() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const title =
    pathname.startsWith("/agent/")
      ? "Agent"
      : pathname.startsWith("/explorer")
        ? "Explorer"
        : pathname.startsWith("/redeem")
          ? "Redeem"
          : "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex w-full items-center gap-2 border-b bg-card px-3 py-3 sm:gap-3 sm:px-6 sm:py-4">
      <h1 className="flex-1 truncate text-base font-medium sm:text-lg">
        {title}
      </h1>

      {pathname.startsWith("/explorer") ? null : (
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-[180px] border bg-card pl-10 pr-14 lg:w-[220px]"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-xs text-muted-foreground">
            <Command className="size-3" />
            <span>K</span>
          </div>
        </div>
      )}

      <WalletConnector size="sm" />
      <ThemeToggle />

      <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
        <a href="/docs">
          <ExternalLink className="size-5" />
          <span className="sr-only">Documentation</span>
        </a>
      </Button>

      <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
        <Link to="/explorer">
          <Sparkles className="size-5" />
          <span className="sr-only">Explorer</span>
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/explorer">
              <Sparkles className="mr-2 size-4" />
              Explorer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/docs">
              <ExternalLink className="mr-2 size-4" />
              Docs
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}


