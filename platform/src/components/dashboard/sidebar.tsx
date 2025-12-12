"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import {
  CreditCard,
  ExternalLink,
  Flame,
  Gift,
  LayoutGrid,
  MessagesSquare,
  Network,
  Search,
  Sparkles,
  Swords,
  UserRound,
  Users,
  Wand2,
} from "lucide-react";

import { ThemeToggle } from "~/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "~/components/ui/sidebar";
import { WalletProfile } from "~/components/wallet/wallet-profile";

const navItems = [
  {
    title: "Dashboard",
    icon: LayoutGrid,
    to: "/dashboard",
    description: "Fleet ops overview",
  },
  {
    title: "Explorer",
    icon: Search,
    to: "/explorer",
    description: "Browse ERC-8004 agents",
  },
  {
    title: "Redeem",
    icon: Gift,
    to: "/redeem",
    description: "Redeem $REGENT tokens",
  },
];

const plannedItems = [
  { title: "Agents", icon: Users },
  { title: "Agent Profile", icon: UserRound },
  { title: "Fleet", icon: Network },
  { title: "Creator", icon: Wand2 },
  { title: "x402", icon: CreditCard },
  { title: "Protocol", icon: Flame },
  { title: "XMTP", icon: MessagesSquare },
  { title: "Games", icon: Swords },
] as const;

export function DashboardSidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <Sidebar collapsible="none">
      <SidebarHeader className="p-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 transition-transform group-hover:scale-105">
            <Sparkles className="size-4 text-white" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 opacity-0 blur-lg transition-opacity group-hover:opacity-50" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold tracking-tight">Regent</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Platform
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                currentPath === item.to ||
                (item.to !== "/" && currentPath.startsWith(item.to));

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                    className={
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 hover:from-cyan-500/15 hover:to-blue-500/15"
                        : ""
                    }
                  >
                    <Link to={item.to}>
                      <item.icon
                        className={
                          isActive ? "text-cyan-400" : "text-muted-foreground"
                        }
                      />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {plannedItems.map((item) => (
              <SidebarMenuItem key={`soon-${item.title}`}>
                <span className="block w-full cursor-not-allowed">
                  <SidebarMenuButton disabled className="disabled:opacity-100">
                    <item.icon className="text-slate-600/70 dark:text-slate-400/50" />
                    <span className="text-slate-600/70 dark:text-slate-400/50">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </span>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60">
            Resources
          </SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="ERC-8004 Spec">
                <a
                  href="https://eips.ethereum.org/EIPS/eip-8004"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                  <span>ERC-8004 Spec</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Documentation">
                <a
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                  <span>Documentation</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <WalletProfile />
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <ThemeToggle />
          <span className="text-[10px] text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
            v0.1.0
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


