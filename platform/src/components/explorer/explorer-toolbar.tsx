import {
  ArrowUpDown,
  Crown,
  Filter,
  Globe,
  LayoutGrid,
  List,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FilterButton } from "./filter-button";

export type SortOption = "newest" | "mostReviews" | "name";
export type GridMode = "regent" | "all";
export type ExplorerView = "grid" | "list";

export function ExplorerToolbar({
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
