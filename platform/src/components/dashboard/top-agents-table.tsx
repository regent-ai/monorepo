"use client";

import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  ExternalLink,
  Filter,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react";

import type { Agent } from "~/lib/erc8004/subgraph";
import { formatAddress, formatTimestamp } from "~/lib/erc8004/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export function TopAgentsTable({ agents }: { agents: Agent[] }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [hasReviews, setHasReviews] = React.useState(false);
  const [hasEndpoint, setHasEndpoint] = React.useState(false);
  const [regentOnly, setRegentOnly] = React.useState(false);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);

  const hasActiveFilters = hasReviews || hasEndpoint || regentOnly;

  const filteredAgents = React.useMemo(() => {
    let result = [...agents];

    if (regentOnly) {
      result = result.filter((agent) => {
        const trusts = agent.registrationFile?.supportedTrusts || [];
        return (
          trusts.some((t) => t.toLowerCase().includes("regent")) ||
          (agent.registrationFile?.mcpEndpoint && agent.registrationFile?.a2aEndpoint)
        );
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((agent) => {
        const name = agent.registrationFile?.name?.toLowerCase() || "";
        const description = agent.registrationFile?.description?.toLowerCase() || "";
        const agentId = agent.agentId.toLowerCase();
        const id = agent.id.toLowerCase();
        return (
          name.includes(query) ||
          description.includes(query) ||
          agentId.includes(query) ||
          id.includes(query)
        );
      });
    }

    if (hasReviews) {
      result = result.filter((agent) => parseInt(agent.totalFeedback) > 0);
    }

    if (hasEndpoint) {
      result = result.filter(
        (agent) => agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint
      );
    }

    result.sort((a, b) => {
      const reviews = parseInt(b.totalFeedback) - parseInt(a.totalFeedback);
      if (reviews !== 0) return reviews;
      return parseInt(b.createdAt) - parseInt(a.createdAt);
    });

    return result;
  }, [agents, hasEndpoint, hasReviews, regentOnly, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / pageSize));

  const paginatedAgents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAgents.slice(startIndex, endIndex);
  }, [filteredAgents, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, hasEndpoint, hasReviews, regentOnly, pageSize]);

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-3.5">
        <div className="flex flex-1 items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="icon"
            className="size-7 shrink-0 sm:size-8"
            asChild
          >
            <Link to="/explorer">
              <ExternalLink className="size-4 text-muted-foreground sm:size-[18px]" />
              <span className="sr-only">Open Explorer</span>
            </Link>
          </Button>
          <span className="text-sm font-medium sm:text-base">Top Agents</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {filteredAgents.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:size-5" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full pl-9 text-sm sm:h-9 sm:w-[180px] sm:pl-10 lg:w-[240px]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 sm:h-9 sm:gap-2 ${
                  hasActiveFilters ? "border-primary" : ""
                }`}
              >
                <Filter className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters ? (
                  <span className="size-1.5 rounded-full bg-primary sm:size-2" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel>Filters</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={regentOnly} onCheckedChange={setRegentOnly}>
                <Crown className="mr-2 size-4" />
                Regent only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={hasEndpoint} onCheckedChange={setHasEndpoint}>
                <Zap className="mr-2 size-4" />
                Has endpoint
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={hasReviews} onCheckedChange={setHasReviews}>
                <MessageSquare className="mr-2 size-4" />
                Has reviews
              </DropdownMenuCheckboxItem>

              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setRegentOnly(false);
                      setHasEndpoint(false);
                      setHasReviews(false);
                    }}
                    className="text-muted-foreground"
                  >
                    Clear filters
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3 sm:px-6">
          <span className="text-[10px] text-muted-foreground sm:text-xs">Filters:</span>
          {regentOnly ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setRegentOnly(false)}
            >
              Regent only
              <span className="sr-only">Remove filter</span>
            </Badge>
          ) : null}
          {hasEndpoint ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setHasEndpoint(false)}
            >
              Has endpoint
              <span className="sr-only">Remove filter</span>
            </Badge>
          ) : null}
          {hasReviews ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setHasReviews(false)}
            >
              Has reviews
              <span className="sr-only">Remove filter</span>
            </Badge>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto px-3 pb-3 sm:px-6 sm:pb-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[40px] text-xs font-medium text-muted-foreground sm:text-sm">
                #
              </TableHead>
              <TableHead className="min-w-[220px] text-xs font-medium text-muted-foreground sm:text-sm">
                Agent
              </TableHead>
              <TableHead className="hidden min-w-[140px] text-xs font-medium text-muted-foreground sm:text-sm md:table-cell">
                Owner
              </TableHead>
              <TableHead className="min-w-[90px] text-xs font-medium text-muted-foreground sm:text-sm">
                Reviews
              </TableHead>
              <TableHead className="hidden min-w-[90px] text-xs font-medium text-muted-foreground sm:text-sm md:table-cell">
                API
              </TableHead>
              <TableHead className="hidden min-w-[140px] text-xs font-medium text-muted-foreground sm:text-sm lg:table-cell">
                Created
              </TableHead>
              <TableHead className="w-[90px] text-right text-xs font-medium text-muted-foreground sm:text-sm">
                Open
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAgents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No agents found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedAgents.map((agent, index) => {
                const name = agent.registrationFile?.name || `Agent #${agent.agentId}`;
                const feedbackCount = parseInt(agent.totalFeedback);
                const hasApi =
                  agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint;

                return (
                  <TableRow key={agent.id}>
                    <TableCell className="text-xs font-medium sm:text-sm">
                      {(currentPage - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 flex-col">
                        <Link
                          to="/agent/$id"
                          params={{ id: agent.id }}
                          className="truncate text-xs font-medium hover:underline sm:text-sm"
                        >
                          {name}
                        </Link>
                        <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                          {agent.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                      {formatAddress(agent.owner)}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground sm:text-sm">
                      {feedbackCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {hasApi ? (
                        <Badge variant="secondary" className="gap-1 text-[10px] sm:text-xs">
                          <Zap className="size-3" />
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {formatTimestamp(agent.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/agent/$id" params={{ id: agent.id }}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t px-3 py-3 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span className="hidden sm:inline">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as any)}
            className="h-8 rounded-md border border-border bg-card px-2 text-xs outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">
            {filteredAgents.length === 0
              ? "0 of 0"
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  filteredAgents.length
                )} of ${filteredAgents.length}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="mx-1 flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  className="size-8"
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


