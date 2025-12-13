import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Search,
  Zap,
} from "lucide-react";
import * as z from "zod";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  AgentGridCell,
  AgentPreviewDialog,
  ExplorerToolbar,
  PageSizeSelect,
  type ExplorerView,
  type GridMode,
  type SortOption,
} from "~/components/explorer";
import { fetchAgents, fetchGlobalStats, type Agent } from "~/lib/erc8004/subgraph";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  formatAddress,
  formatTimestamp,
} from "~/lib/erc8004/utils";
import { useResponsiveGridSize } from "~/hooks/use-responsive-grid-size";
import ThiingsGrid, { type ItemConfig } from "~/lib/thiings-grid";

// =============================================================================
// Config
// =============================================================================

const GRID_INITIAL_BATCH_SIZE = 500;
const GRID_LOAD_MORE_BATCH_SIZE = 200;
const GRID_PREFETCH_THRESHOLD = 50;
const GRID_FAR_FROM_LOADED_THRESHOLD = 750;

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
  component: ExplorerPage,
});

type GlobalStats = Awaited<ReturnType<typeof fetchGlobalStats>>;

function ExplorerPage() {
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
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

  const loadInitial = useCallback(async () => {
    setIsInitialLoading(true);
    setInitialLoadError(null);

    try {
      const [nextAgents, nextStats] = await Promise.all([
        fetchAgents(GRID_INITIAL_BATCH_SIZE, 0),
        fetchGlobalStats(),
      ]);
      setAgents(nextAgents);
      setStats(nextStats);
    } catch (e) {
      setAgents([]);
      setStats(null);
      setInitialLoadError(
        e instanceof Error ? e.message : "Failed to load Explorer data"
      );
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

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
    const n = stats ? Number(stats.totalAgents) : Number.NaN;
    if (Number.isFinite(n) && n > 0) return n;
    return Math.max(GRID_INITIAL_BATCH_SIZE, agents.length);
  }, [agents.length, stats]);

  const hasLoadedAll = !!stats && agents.length >= totalAgentsGlobal;

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
    if (isInitialLoading) return;
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
  }, [isInitialLoading, totalAgentsGlobal]);

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
      if (isInitialLoading) return;
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
    [hasLoadedAll, isFarFromLoaded, isInitialLoading, loadMoreAgents, explorerSearch.view, explorerSearch.mode]
  );

  useEffect(() => {
    if (explorerSearch.view !== "list") return;
    if (isInitialLoading) return;
    if (hasLoadedAll) return;

    const needed = explorerSearch.page * explorerSearch.perPage;
    if (processedAgents.length >= needed) return;

    void loadMoreAgents();
  }, [
    explorerSearch.page,
    explorerSearch.perPage,
    explorerSearch.view,
    isInitialLoading,
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
              {isInitialLoading ? (
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-muted-foreground/50" />
              ) : (
                <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
              )}
              <p className="text-lg font-medium">
                {isInitialLoading
                  ? "Loading agents…"
                  : initialLoadError
                    ? "Explorer failed to load"
                    : "No agents on this page"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isInitialLoading
                  ? "Fetching the ERC-8004 registry. This can take a moment on a cold cache."
                  : initialLoadError
                    ? initialLoadError
                    : "Try adjusting your filters or loading more agents."}
              </p>
              <div className="mt-4 flex gap-2">
                {initialLoadError ? (
                  <Button onClick={() => void loadInitial()}>Retry</Button>
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
              {isInitialLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Search className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-lg font-medium">
              {isInitialLoading
                ? "Loading agents…"
                : initialLoadError
                  ? "Explorer failed to load"
                  : explorerSearch.mode === "regent"
                    ? "No Regent agents yet"
                    : "No agents found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isInitialLoading
                ? "Fetching the ERC-8004 registry. This can take a moment on a cold cache."
                : initialLoadError
                  ? initialLoadError
                  : explorerSearch.mode === "regent"
                    ? "Regent agents will appear here once you deploy. Switch to All to browse ERC-8004."
                    : "Try adjusting your search or filters"}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {initialLoadError ? (
                <Button onClick={() => void loadInitial()}>Retry</Button>
              ) : explorerSearch.mode === "regent" ? (
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
          {stats ? parseInt(stats.totalFeedback).toLocaleString() : "…"} reviews
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
            <div className="font-medium">You're far from loaded results</div>
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
