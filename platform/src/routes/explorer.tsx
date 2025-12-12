import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, spring } from "animejs";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  ExternalLink,
  Filter,
  Globe,
  LayoutGrid,
  List,
  MessageSquare,
  Search,
  Sparkles,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import * as z from "zod";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { fetchAgents, fetchGlobalStats, type Agent } from "~/lib/erc8004/subgraph";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  formatAddress,
  formatTimestamp,
} from "~/lib/erc8004/utils";
import ThiingsGrid, { type ItemConfig } from "~/lib/thiings-grid";

// =============================================================================
// Config
// =============================================================================

const GRID_INITIAL_BATCH_SIZE = 500;
const GRID_LOAD_MORE_BATCH_SIZE = 200;
const GRID_PREFETCH_THRESHOLD = 50;
const GRID_FAR_FROM_LOADED_THRESHOLD = 750;

type SortOption = "newest" | "mostReviews" | "name";
type GridMode = "regent" | "all";
type ExplorerView = "grid" | "list";

// Regent mode is reserved for Regent-deployed agents.
// Until Regent agent deployment is live, we intentionally show an empty state.
const IS_REGENT_DEPLOYMENT_LIVE = false;

function isRegentAgent(_agent: Agent): boolean {
  return IS_REGENT_DEPLOYMENT_LIVE ? false : false;
}

interface ExplorerSearchState {
  view?: ExplorerView;
  mode?: GridMode;
  sort?: SortOption;
  search?: string;
  hasReviews?: boolean;
  hasEndpoint?: boolean;
  page?: number;
  perPage?: number;
}

const numberFromSearch = z.preprocess((v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}, z.number().int().min(1).optional());

const booleanFromSearch = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return undefined;
}, z.boolean().optional());

const explorerSearchSchema: z.ZodType<ExplorerSearchState> = z.object({
  view: z.enum(["grid", "list"]).optional(),
  mode: z.enum(["regent", "all"]).optional(),
  sort: z.enum(["newest", "mostReviews", "name"]).optional(),
  search: z.string().optional(),
  hasReviews: booleanFromSearch,
  hasEndpoint: booleanFromSearch,
  page: numberFromSearch,
  perPage: numberFromSearch,
});

export const Route = createFileRoute("/explorer")({
  validateSearch: (search) => explorerSearchSchema.parse(search),
  loader: async () => {
    const [agents, stats] = await Promise.all([
      fetchAgents(GRID_INITIAL_BATCH_SIZE, 0),
      fetchGlobalStats(),
    ]);
    return { agents, stats };
  },
  component: ExplorerPage,
});

function ExplorerPage() {
  const { agents: initialAgents, stats } = Route.useLoaderData();
  const searchState = Route.useSearch();
  const navigate = Route.useNavigate();

  const explorerSearch = {
    view: searchState.view ?? "grid",
    mode: searchState.mode ?? "all",
    sort: searchState.sort ?? "newest",
    search: searchState.search ?? "",
    hasReviews: searchState.hasReviews ?? false,
    hasEndpoint: searchState.hasEndpoint ?? false,
    page: searchState.page ?? 1,
    perPage: searchState.perPage ?? DEFAULT_PAGE_SIZE,
  } satisfies Required<ExplorerSearchState>;

  const gridRef = useRef<ThiingsGrid | null>(null);
  const atmosphereRef = useRef<HTMLDivElement | null>(null);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isFarFromLoaded, setIsFarFromLoaded] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const agentsRef = useRef<Agent[]>(agents);
  const isLoadingMoreRef = useRef(false);
  const processedAgentsRef = useRef<Agent[]>([]);

  agentsRef.current = agents;
  isLoadingMoreRef.current = isLoadingMore;

  useEffect(() => {
    setAgents(initialAgents);
  }, [initialAgents]);

  const [searchDraft, setSearchDraft] = useState(explorerSearch.search);
  useEffect(() => {
    setSearchDraft(explorerSearch.search);
  }, [explorerSearch.search]);

  useEffect(() => {
    const next = searchDraft.trim();
    if (next === explorerSearch.search) return;

    const timeoutId = setTimeout(() => {
      navigate({
        to: "/explorer",
        search: (prev) => ({
          ...prev,
          search: next ? next : undefined,
          page: undefined,
        }),
      });
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [navigate, searchDraft, explorerSearch.search]);

  const gridSize = useResponsiveGridSize();

  const chainLabel = useMemo(() => {
    const ids = new Set(agents.map((a) => Number(a.chainId)).filter(Number.isFinite));
    if (ids.size === 1) {
      const only = [...ids][0];
      if (only === 8453) return "Base Mainnet";
      if (only === 84532) return "Base Sepolia";
      if (only === 1) return "Ethereum Mainnet";
      if (only === 11155111) return "Ethereum Sepolia";
      return `Chain ${only}`;
    }
    return "multiple chains";
  }, [agents]);

  const totalAgentsGlobal = useMemo(() => {
    const n = Number(stats.totalAgents);
    return Number.isFinite(n) ? n : agents.length;
  }, [agents.length, stats.totalAgents]);

  const hasLoadedAll = agents.length >= totalAgentsGlobal;

  const processedAgents = useMemo(() => {
    let result = [...agents];

    if (explorerSearch.mode === "regent") {
      return result.filter(isRegentAgent);
    }

    if (explorerSearch.search) {
      const query = explorerSearch.search.toLowerCase();
      result = result.filter((agent) => {
        const name = agent.registrationFile?.name?.toLowerCase() || "";
        const description = agent.registrationFile?.description?.toLowerCase() || "";
        const id = agent.agentId.toLowerCase();
        return name.includes(query) || description.includes(query) || id.includes(query);
      });
    }

    if (explorerSearch.hasReviews) {
      result = result.filter((agent) => parseInt(agent.totalFeedback) > 0);
    }

    if (explorerSearch.hasEndpoint) {
      result = result.filter(
        (agent) => agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint
      );
    }

    switch (explorerSearch.sort) {
      case "newest":
        result.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt));
        break;
      case "mostReviews":
        result.sort((a, b) => parseInt(b.totalFeedback) - parseInt(a.totalFeedback));
        break;
      case "name":
        result.sort((a, b) => {
          const nameA = a.registrationFile?.name || `Agent #${a.agentId}`;
          const nameB = b.registrationFile?.name || `Agent #${b.agentId}`;
          return nameA.localeCompare(nameB);
        });
        break;
    }

    return result;
  }, [
    agents,
    explorerSearch.hasEndpoint,
    explorerSearch.hasReviews,
    explorerSearch.mode,
    explorerSearch.search,
    explorerSearch.sort,
  ]);

  processedAgentsRef.current = processedAgents;

  const hasActiveFilters =
    explorerSearch.search || explorerSearch.hasReviews || explorerSearch.hasEndpoint;

  const loadMoreAgents = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    if (agentsRef.current.length >= totalAgentsGlobal) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const currentCount = agentsRef.current.length;
      const remaining = totalAgentsGlobal - currentCount;
      const first = Math.min(GRID_LOAD_MORE_BATCH_SIZE, Math.max(0, remaining));
      if (first <= 0) return;

      const next = await fetchAgents(first, currentCount);

      setAgents((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const added = next.filter((a) => !seen.has(a.id));
        return [...prev, ...added];
      });
    } catch (e) {
      setLoadMoreError(
        e instanceof Error ? e.message : "Failed to load more agents"
      );
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [totalAgentsGlobal]);

  const openPreview = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback((open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) setSelectedAgent(null);
  }, []);

  const setView = useCallback(
    (view: ExplorerView) => {
      navigate({
        to: "/explorer",
        search: (prev) => ({
          ...prev,
          view: view === "grid" ? undefined : view,
          page: undefined,
        }),
      });
    },
    [navigate]
  );

  const setMode = useCallback(
    (mode: GridMode) => {
      navigate({
        to: "/explorer",
        search: (prev) => ({
          ...prev,
          mode: mode === "all" ? undefined : mode,
          page: undefined,
        }),
      });
    },
    [navigate]
  );

  const cycleSort = useCallback(() => {
    const options: SortOption[] = ["newest", "mostReviews", "name"];
    const currentIndex = options.indexOf(explorerSearch.sort);
    const next = options[(currentIndex + 1) % options.length]!;

    navigate({
      to: "/explorer",
      search: (prev) => ({
        ...prev,
        sort: next === "newest" ? undefined : next,
        page: undefined,
      }),
    });
  }, [navigate, explorerSearch.sort]);

  const toggleFilter = useCallback(
    (filterName: "hasReviews" | "hasEndpoint") => {
      navigate({
        to: "/explorer",
        search: (prev) => {
          const next = !prev[filterName];
          return {
            ...prev,
            [filterName]: next ? true : undefined,
            page: undefined,
          };
        },
      });
    },
    [navigate]
  );

  const clearFilters = useCallback(() => {
    setSearchDraft("");
    navigate({
      to: "/explorer",
      search: (prev) => ({
        ...prev,
        search: undefined,
        hasReviews: undefined,
        hasEndpoint: undefined,
        page: undefined,
      }),
    });
  }, [navigate]);

  const setPerPage = useCallback(
    (next: number) => {
      navigate({
        to: "/explorer",
        search: (prev) => ({
          ...prev,
          perPage: next === DEFAULT_PAGE_SIZE ? undefined : next,
          page: undefined,
        }),
      });
    },
    [navigate]
  );

  const setPage = useCallback(
    (next: number) => {
      navigate({
        to: "/explorer",
        search: (prev) => ({
          ...prev,
          page: next <= 1 ? undefined : next,
        }),
      });
    },
    [navigate]
  );

  const onVisibleRangeChange = useCallback(
    ({
      maxIndex,
      offset,
    }: {
      minIndex: number;
      maxIndex: number;
      offset: { x: number; y: number };
    }) => {
      if (atmosphereRef.current) {
        const x = Math.round(offset.x * -0.06);
        const y = Math.round(offset.y * -0.06);
        atmosphereRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      if (explorerSearch.mode === "regent") return;
      if (explorerSearch.view !== "grid") return;
      if (hasLoadedAll) return;

      const target = maxIndex + GRID_PREFETCH_THRESHOLD;
      const available = processedAgentsRef.current.length;
      if (target <= available) {
        if (isFarFromLoaded) setIsFarFromLoaded(false);
        return;
      }

      const gap = target - available;
      if (gap > GRID_FAR_FROM_LOADED_THRESHOLD) {
        setIsFarFromLoaded(true);
        return;
      }

      if (isFarFromLoaded) setIsFarFromLoaded(false);
      void loadMoreAgents();
    },
    [hasLoadedAll, isFarFromLoaded, loadMoreAgents, explorerSearch.view]
  );

  useEffect(() => {
    if (explorerSearch.view !== "list") return;
    if (hasLoadedAll) return;

    const needed = explorerSearch.page * explorerSearch.perPage;
    if (processedAgents.length >= needed) return;

    void loadMoreAgents();
  }, [
    explorerSearch.page,
    explorerSearch.perPage,
    explorerSearch.view,
    hasLoadedAll,
    loadMoreAgents,
    processedAgents.length,
  ]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(processedAgents.length / explorerSearch.perPage));
  }, [processedAgents.length, explorerSearch.perPage]);

  useEffect(() => {
    if (explorerSearch.view !== "list") return;
    if (!hasLoadedAll) return;
    if (explorerSearch.page <= totalPages) return;
    setPage(totalPages);
  }, [explorerSearch.page, explorerSearch.view, hasLoadedAll, setPage, totalPages]);

  const renderGridCell = useCallback(
    ({ gridIndex, isMoving }: ItemConfig) => {
      const agent = processedAgents[gridIndex];

      if (!agent) {
        return (
          <div className="logo-border logo-border--ghost absolute inset-2 flex items-center justify-center rounded-3xl">
            <span className="text-xs text-muted-foreground/30">#{gridIndex}</span>
          </div>
        );
      }

      return (
        <AgentGridCell
          agent={agent}
          gridIndex={gridIndex}
          isMoving={isMoving}
          onOpen={() => openPreview(agent)}
        />
      );
    },
    [openPreview, processedAgents]
  );

  if (explorerSearch.view === "list") {
    const safePage = Math.min(explorerSearch.page, totalPages);
    const pageStart = (safePage - 1) * explorerSearch.perPage;
    const pageAgents = processedAgents.slice(pageStart, pageStart + explorerSearch.perPage);

    return (
      <div className="min-h-full w-full">
        <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <ExplorerToolbar
              view={explorerSearch.view}
              mode={explorerSearch.mode}
              sort={explorerSearch.sort}
              searchDraft={searchDraft}
              onSearchDraftChange={setSearchDraft}
              hasActiveFilters={!!hasActiveFilters}
              hasReviews={explorerSearch.hasReviews}
              hasEndpoint={explorerSearch.hasEndpoint}
              isFiltersOpen={isFiltersOpen}
              onToggleFilters={() => setIsFiltersOpen((v) => !v)}
              onClearFilters={clearFilters}
              onToggleFilter={toggleFilter}
              onSetView={setView}
              onSetMode={setMode}
              onCycleSort={cycleSort}
              totalVisible={processedAgents.length}
              loadedCount={agents.length}
              totalGlobal={totalAgentsGlobal}
              chainLabel={chainLabel}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{safePage}</span> of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Per page
                <PageSizeSelect
                  currentSize={explorerSearch.perPage}
                  sizes={PAGE_SIZES}
                  onChange={setPerPage}
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous page</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages && hasLoadedAll}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next page</span>
                </Button>
              </div>
            </div>
          </div>

          {loadMoreError && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {loadMoreError}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-border/50 bg-card/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Owner</TableHead>
                  <TableHead className="hidden md:table-cell">Reviews</TableHead>
                  <TableHead className="hidden md:table-cell">API</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageAgents.map((agent) => {
                  const name = agent.registrationFile?.name || `Agent #${agent.agentId}`;
                  const feedbackCount = parseInt(agent.totalFeedback);
                  const hasApi =
                    agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint;

                  return (
                    <TableRow key={agent.id} onClick={() => openPreview(agent)}>
                      <TableCell className="max-w-[240px]">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Link
                              to="/agent/$id"
                              params={{ id: agent.id }}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate font-medium hover:underline"
                            >
                              {name}
                            </Link>
                            {feedbackCount > 0 && (
                              <Badge variant="secondary" className="hidden sm:inline-flex">
                                <MessageSquare />
                                {feedbackCount}
                              </Badge>
                            )}
                            {hasApi && (
                              <Badge variant="secondary" className="hidden md:inline-flex">
                                <Zap />
                                API
                              </Badge>
                            )}
                          </div>
                          <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            ID: {agent.agentId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-[11px] text-muted-foreground sm:table-cell">
                        {formatAddress(agent.owner)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {feedbackCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {hasApi ? "Yes" : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatTimestamp(agent.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {pageAgents.length === 0 && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/30 py-16 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">No agents on this page</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or loading more agents.
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
                {!hasLoadedAll && (
                  <Button onClick={() => void loadMoreAgents()} disabled={isLoadingMore}>
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <AgentPreviewDialog
          agent={selectedAgent}
          open={isPreviewOpen}
          onOpenChange={closePreview}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={atmosphereRef} className="explorer-atmosphere" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-background via-background/80 to-transparent pb-8 pt-4">
        <div className="pointer-events-auto mx-auto max-w-7xl px-4">
          <ExplorerToolbar
            view={explorerSearch.view}
            mode={explorerSearch.mode}
            sort={explorerSearch.sort}
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            hasActiveFilters={!!hasActiveFilters}
            hasReviews={explorerSearch.hasReviews}
            hasEndpoint={explorerSearch.hasEndpoint}
            isFiltersOpen={isFiltersOpen}
            onToggleFilters={() => setIsFiltersOpen((v) => !v)}
            onClearFilters={clearFilters}
            onToggleFilter={toggleFilter}
            onSetView={setView}
            onSetMode={setMode}
            onCycleSort={cycleSort}
            totalVisible={processedAgents.length}
            loadedCount={agents.length}
            totalGlobal={totalAgentsGlobal}
            chainLabel={chainLabel}
          />
        </div>
      </div>

      <ThiingsGrid
        ref={gridRef}
        gridSize={gridSize}
        renderItem={renderGridCell}
        onVisibleRangeChange={onVisibleRangeChange}
        className="bg-gradient-to-br from-background via-background to-muted/20"
      />

      {processedAgents.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="pointer-events-auto flex flex-col items-center rounded-2xl border border-border/50 bg-card/90 p-8 text-center backdrop-blur-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">
              {explorerSearch.mode === "regent" ? "No Regent agents yet" : "No agents found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {explorerSearch.mode === "regent"
                ? "Regent agents will appear here once you deploy. Switch to All to browse ERC-8004."
                : "Try adjusting your search or filters"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {explorerSearch.mode === "regent" ? (
                <Button onClick={() => setMode("all")}>Switch to All</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                  {!hasLoadedAll && (
                    <Button onClick={() => void loadMoreAgents()} disabled={isLoadingMore}>
                      {isLoadingMore ? "Loading..." : "Load more"}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 space-y-2">
        <div className="pointer-events-auto rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm">
          Loaded {agents.length.toLocaleString()} /{" "}
          {totalAgentsGlobal.toLocaleString()} • Showing{" "}
          {processedAgents.length.toLocaleString()}
          {hasActiveFilters ? " (filtered)" : ""} •{" "}
          {parseInt(stats.totalFeedback).toLocaleString()} reviews
          {isLoadingMore ? " • Loading…" : ""}
        </div>

        {loadMoreError && (
          <div className="pointer-events-auto rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive backdrop-blur-sm">
            {loadMoreError}
          </div>
        )}
      </div>

      {isFarFromLoaded && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20">
          <div className="pointer-events-auto max-w-xs rounded-lg border border-border/50 bg-card/80 p-3 text-xs backdrop-blur-sm">
            <div className="font-medium">You’re far from loaded results</div>
            <div className="mt-1 text-muted-foreground">
              Recenter to explore near the loaded region, or load more to expand it.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => gridRef.current?.publicResetPosition()}
              >
                Recenter
              </Button>
              {!hasLoadedAll && (
                <Button size="sm" onClick={() => void loadMoreAgents()} disabled={isLoadingMore}>
                  {isLoadingMore ? "Loading…" : "Load more"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <AgentPreviewDialog
        agent={selectedAgent}
        open={isPreviewOpen}
        onOpenChange={closePreview}
      />
    </div>
  );
}

// =============================================================================
// Components
// =============================================================================

const AgentGridCell = memo(function AgentGridCell({
  agent,
  gridIndex,
  isMoving,
  onOpen,
}: {
  agent: Agent;
  gridIndex: number;
  isMoving: boolean;
  onOpen: () => void;
}) {
  const cardRef = useRef<HTMLButtonElement | null>(null);

  const name = agent.registrationFile?.name || `Agent #${agent.agentId}`;
  const description = agent.registrationFile?.description;
  const trusts = agent.registrationFile?.supportedTrusts || [];
  const feedbackCount = parseInt(agent.totalFeedback);
  const hasEndpoint =
    agent.registrationFile?.mcpEndpoint || agent.registrationFile?.a2aEndpoint;
  const image = agent.registrationFile?.image;

  const isRegent = useMemo(() => {
    const supported = trusts ?? [];
    return (
      supported.some((t) => t.toLowerCase().includes("regent")) ||
      (agent.registrationFile?.mcpEndpoint && agent.registrationFile?.a2aEndpoint)
    );
  }, [agent.registrationFile?.a2aEndpoint, agent.registrationFile?.mcpEndpoint, trusts]);

  const handleOpen = useCallback(() => {
    if (isMoving) return;

    if (cardRef.current) {
      animate(cardRef.current, {
        scale: [
          { to: 0.985, ease: "inOut(3)", duration: 90 },
          { to: 1.04, ease: spring({ stiffness: 320, damping: 18 }) },
          { to: 1, ease: spring({ stiffness: 420, damping: 26 }) },
        ],
        duration: 520,
      });
    }

    onOpen();
  }, [isMoving, onOpen]);

  return (
    <button
      type="button"
      ref={cardRef}
      onClick={handleOpen}
      className={`agent-card logo-border logo-border--solid absolute inset-2 flex flex-col overflow-hidden rounded-3xl text-left backdrop-blur-sm transition-[transform,box-shadow,filter] ${
        isMoving
          ? "shadow-xl"
          : "shadow-md hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 hover:scale-[1.01] hover:brightness-[1.02]"
      }`}
      style={{
        pointerEvents: isMoving ? "none" : "auto",
        cursor: isMoving ? "default" : "pointer",
      }}
    >
      <div className="relative h-16 shrink-0 bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-4/20">
        {image && (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background/35 via-transparent to-transparent" />

        <div className="absolute right-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground backdrop-blur-sm">
          #{gridIndex}
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1">
          {isRegent && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[10px] text-primary-foreground">
              <Crown className="h-2.5 w-2.5" />
              Regent
            </span>
          )}
          {hasEndpoint && (
            <span className="flex items-center gap-0.5 rounded-full bg-chart-1/90 px-1.5 py-0.5 text-[10px] text-white">
              <Zap className="h-2.5 w-2.5" />
              API
            </span>
          )}
          {feedbackCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-chart-2/90 px-1.5 py-0.5 text-[10px] text-white">
              <MessageSquare className="h-2.5 w-2.5" />
              {feedbackCount}
            </span>
          )}
        </div>
      </div>

      <div className="card-content flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-medium">{name}</h3>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          ID: {agent.agentId}
        </p>

        {description && (
          <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {trusts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trusts.slice(0, 2).map((trust) => (
              <span
                key={trust}
                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {trust}
              </span>
            ))}
            {trusts.length > 2 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{trusts.length - 2}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted-foreground">
          <span className="font-mono">{formatAddress(agent.owner)}</span>
          <span>{formatTimestamp(agent.createdAt)}</span>
        </div>
      </div>
    </button>
  );
});

function FilterButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all ${
        active
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function ExplorerToolbar({
  view,
  mode,
  sort,
  searchDraft,
  onSearchDraftChange,
  hasActiveFilters,
  hasReviews,
  hasEndpoint,
  isFiltersOpen,
  onToggleFilters,
  onClearFilters,
  onToggleFilter,
  onSetView,
  onSetMode,
  onCycleSort,
  totalVisible,
  loadedCount,
  totalGlobal,
  chainLabel,
}: {
  view: ExplorerView;
  mode: GridMode;
  sort: SortOption;
  searchDraft: string;
  onSearchDraftChange: (v: string) => void;
  hasActiveFilters: boolean;
  hasReviews: boolean;
  hasEndpoint: boolean;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  onToggleFilter: (filterName: "hasReviews" | "hasEndpoint") => void;
  onSetView: (view: ExplorerView) => void;
  onSetMode: (mode: GridMode) => void;
  onCycleSort: () => void;
  totalVisible: number;
  loadedCount: number;
  totalGlobal: number;
  chainLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-chart-2/20 ring-1 ring-primary/20">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">
              Agent Explorer
            </h1>
            <p className="text-xs text-muted-foreground">
              ERC-8004 agents registered onchain on {chainLabel} •{" "}
              {totalVisible.toLocaleString()} agents
              {hasActiveFilters ? " (filtered)" : ""} •{" "}
              {loadedCount.toLocaleString()} loaded • {totalGlobal.toLocaleString()} total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/80 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => onSetView("grid")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all ${
                view === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => onSetView("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/80 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => onSetMode("regent")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all ${
                mode === "regent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              Regent
            </button>
            <button
              type="button"
              onClick={() => onSetMode("all")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all ${
                mode === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              All
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search…"
                value={searchDraft}
                onChange={(e) => onSearchDraftChange(e.target.value)}
                className="w-56 bg-card/80 pl-10 pr-10 backdrop-blur-sm"
              />
              {searchDraft ? (
                <button
                  type="button"
                  onClick={() => onSearchDraftChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </button>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFilters}
              className={`bg-card/80 backdrop-blur-sm ${
                hasActiveFilters ? "border-primary text-primary" : ""
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle filters</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-card/80 backdrop-blur-sm"
              onClick={onCycleSort}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sort === "newest" && "Newest"}
              {sort === "mostReviews" && "Most Reviews"}
              {sort === "name" && "Name"}
            </Button>
          </div>
        </div>
      </div>

      {isFiltersOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-card/80 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>

          <FilterButton
            active={hasReviews}
            onClick={() => onToggleFilter("hasReviews")}
            icon={<MessageSquare className="h-3.5 w-3.5" />}
          >
            Has reviews
          </FilterButton>

          <FilterButton
            active={hasEndpoint}
            onClick={() => onToggleFilter("hasEndpoint")}
            icon={<Zap className="h-3.5 w-3.5" />}
          >
            Has API endpoint
          </FilterButton>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-auto flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AgentPreviewDialog({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const name = agent?.registrationFile?.name || (agent ? `Agent #${agent.agentId}` : "");
  const description = agent?.registrationFile?.description;
  const image = agent?.registrationFile?.image;
  const trusts = agent?.registrationFile?.supportedTrusts || [];
  const mcpEndpoint = agent?.registrationFile?.mcpEndpoint;
  const a2aEndpoint = agent?.registrationFile?.a2aEndpoint;
  const feedbackCount = agent ? parseInt(agent.totalFeedback) : 0;

  useEffect(() => {
    if (!open || !contentRef.current) return;

    animate(contentRef.current, {
      opacity: [{ to: 1, duration: 220, ease: "out(3)" }],
      translateY: [{ to: 0, duration: 520, ease: spring({ stiffness: 260, damping: 22 }) }],
      scale: [{ to: 1, duration: 520, ease: spring({ stiffness: 260, damping: 24 }) }],
      duration: 520,
      begin: () => {
        contentRef.current?.style.setProperty("opacity", "0");
        contentRef.current?.style.setProperty("transform", "translate3d(0, 14px, 0) scale(0.98)");
      },
    });
  }, [agent?.id, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={contentRef}
        className="max-h-[85vh] overflow-y-auto border-border/60 p-0 sm:max-w-xl"
      >
        {agent ? (
          <div className="flex h-full flex-col">
            <DialogHeader className="relative overflow-hidden border-b bg-gradient-to-br from-primary/20 via-chart-2/10 to-chart-4/20 p-6">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[1px]"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-background/65 via-background/15 to-transparent" />
              <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_60%),radial-gradient(circle_at_80%_100%,color-mix(in_oklch,var(--chart-2)_22%,transparent),transparent_60%)]" />

              <div className="relative">
                <DialogTitle className="font-display truncate text-xl tracking-tight">
                  {name}
                </DialogTitle>
                <DialogDescription className="mt-1 line-clamp-2 text-sm">
                  {description || "No description provided."}
                </DialogDescription>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    ERC-8004 • {agent.id}
                  </Badge>
                  {feedbackCount > 0 && (
                    <Badge variant="secondary">
                      <MessageSquare />
                      {feedbackCount}
                    </Badge>
                  )}
                  {(mcpEndpoint || a2aEndpoint) && (
                    <Badge variant="secondary">
                      <Zap />
                      API
                    </Badge>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 rounded-xl border border-border/50 bg-card/40 p-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-mono">{agent.chainId}:{agent.agentId}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-mono">{formatAddress(agent.owner)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatTimestamp(agent.createdAt)}</span>
                </div>
              </div>

              {trusts.length > 0 && (
                <div>
                  <div className="text-sm font-medium">Trust models</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {trusts.map((trust) => (
                      <Badge key={trust} variant="outline">
                        {trust}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(mcpEndpoint || a2aEndpoint) && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Endpoints</div>
                  {mcpEndpoint ? (
                    <a
                      href={mcpEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2 text-sm hover:bg-card/50"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          MCP
                        </span>
                        {mcpEndpoint}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : null}
                  {a2aEndpoint ? (
                    <a
                      href={a2aEndpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2 text-sm hover:bg-card/50"
                    >
                      <span className="truncate">
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          A2A
                        </span>
                        {a2aEndpoint}
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            <div className="border-t p-6">
              <Button
                asChild
                className="w-full bg-linear-to-b from-foreground to-foreground/90 text-background"
                onClick={() => onOpenChange(false)}
              >
                <Link to="/agent/$id" params={{ id: agent.id }}>
                  Open full profile
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PageSizeSelect({
  currentSize,
  sizes,
  onChange,
}: {
  currentSize: number;
  sizes: number[];
  onChange: (size: number) => void;
}) {
  return (
    <div className="relative">
      <select
        value={currentSize}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="appearance-none rounded-lg border border-border bg-card px-3 py-1.5 pr-8 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/30"
      >
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
    </div>
  );
}

function useResponsiveGridSize() {
  const [gridSize, setGridSize] = useState(280);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setGridSize(220);
        return;
      }
      if (width < 1024) {
        setGridSize(260);
        return;
      }
      setGridSize(280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return gridSize;
}


