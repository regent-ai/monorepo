"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Copy,
  Eye,
  FileInput,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
  Database,
} from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { deals } from "~/mock-data/deals";
import { useDashboardStore } from "~/store/dashboard-store";

const numberFormatter = new Intl.NumberFormat("en-US");

const stages = ["Negotiation", "Proposal Sent", "Qualified", "Discovery"] as const;
const owners = ["Alex Ray", "Mina Swan", "John Kim", "Sarah Lee"] as const;

const valueRanges = [
  { label: "All Values", value: "all" },
  { label: "< $10,000", value: "under10k" },
  { label: "$10,000 - $20,000", value: "10k-20k" },
  { label: "> $20,000", value: "over20k" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

export function DealsTable() {
  const searchQuery = useDashboardStore((state) => state.searchQuery);
  const stageFilter = useDashboardStore((state) => state.stageFilter);
  const ownerFilter = useDashboardStore((state) => state.ownerFilter);
  const valueFilter = useDashboardStore((state) => state.valueFilter);
  const setSearchQuery = useDashboardStore((state) => state.setSearchQuery);
  const setStageFilter = useDashboardStore((state) => state.setStageFilter);
  const setOwnerFilter = useDashboardStore((state) => state.setOwnerFilter);
  const setValueFilter = useDashboardStore((state) => state.setValueFilter);
  const clearFilters = useDashboardStore((state) => state.clearFilters);

  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const hasActiveFilters =
    stageFilter !== "all" || ownerFilter !== "all" || valueFilter !== "all";

  const filteredDeals = React.useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        deal.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.owner.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === "all" || deal.stage === stageFilter;
      const matchesOwner = ownerFilter === "all" || deal.owner === ownerFilter;

      let matchesValue = true;
      if (valueFilter === "under10k") matchesValue = deal.value < 10000;
      else if (valueFilter === "10k-20k")
        matchesValue = deal.value >= 10000 && deal.value <= 20000;
      else if (valueFilter === "over20k") matchesValue = deal.value > 20000;

      return matchesSearch && matchesStage && matchesOwner && matchesValue;
    });
  }, [searchQuery, stageFilter, ownerFilter, valueFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / pageSize));

  const paginatedDeals = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDeals.slice(startIndex, endIndex);
  }, [filteredDeals, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stageFilter, ownerFilter, valueFilter, pageSize]);

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
          >
            <ClipboardList className="size-4 text-muted-foreground sm:size-[18px]" />
          </Button>
          <span className="text-sm font-medium sm:text-base">Active Deals</span>
          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">
            {filteredDeals.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground sm:size-5" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full pl-9 text-sm sm:h-9 sm:w-[160px] sm:pl-10 lg:w-[200px]"
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
              <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={stageFilter === "all"}
                onCheckedChange={() => setStageFilter("all")}
              >
                All Stages
              </DropdownMenuCheckboxItem>
              {stages.map((stage) => (
                <DropdownMenuCheckboxItem
                  key={stage}
                  checked={stageFilter === stage}
                  onCheckedChange={() => setStageFilter(stage)}
                >
                  {stage}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by Owner</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={ownerFilter === "all"}
                onCheckedChange={() => setOwnerFilter("all")}
              >
                All Owners
              </DropdownMenuCheckboxItem>
              {owners.map((owner) => (
                <DropdownMenuCheckboxItem
                  key={owner}
                  checked={ownerFilter === owner}
                  onCheckedChange={() => setOwnerFilter(owner)}
                >
                  {owner}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Filter by Value</DropdownMenuLabel>
              {valueRanges.map((range) => (
                <DropdownMenuCheckboxItem
                  key={range.value}
                  checked={valueFilter === range.value}
                  onCheckedChange={() => setValueFilter(range.value)}
                >
                  {range.label}
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearFilters}
                    className="text-destructive"
                  >
                    <X className="mr-2 size-4" />
                    Clear all filters
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden h-[22px] w-px bg-border sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 sm:h-9 sm:gap-2"
              >
                <FileInput className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileSpreadsheet className="mr-2 size-4" />
                Import from CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 size-4" />
                Import from Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Database className="mr-2 size-4" />
                Import from CRM
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-3 sm:px-6">
          <span className="text-[10px] text-muted-foreground sm:text-xs">
            Filters:
          </span>
          {stageFilter !== "all" ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setStageFilter("all")}
            >
              {stageFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          ) : null}
          {ownerFilter !== "all" ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setOwnerFilter("all")}
            >
              {ownerFilter}
              <X className="size-2.5 sm:size-3" />
            </Badge>
          ) : null}
          {valueFilter !== "all" ? (
            <Badge
              variant="secondary"
              className="h-5 cursor-pointer gap-1 text-[10px] sm:h-6 sm:text-xs"
              onClick={() => setValueFilter("all")}
            >
              {valueRanges.find((r) => r.value === valueFilter)?.label}
              <X className="size-2.5 sm:size-3" />
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
              <TableHead className="min-w-[180px] text-xs font-medium text-muted-foreground sm:text-sm">
                Deal Name
              </TableHead>
              <TableHead className="hidden min-w-[140px] text-xs font-medium text-muted-foreground sm:text-sm md:table-cell">
                Client
              </TableHead>
              <TableHead className="min-w-[100px] text-xs font-medium text-muted-foreground sm:text-sm">
                Stage
              </TableHead>
              <TableHead className="min-w-[90px] text-xs font-medium text-muted-foreground sm:text-sm">
                Value
              </TableHead>
              <TableHead className="hidden min-w-[150px] text-xs font-medium text-muted-foreground sm:text-sm lg:table-cell">
                Owner
              </TableHead>
              <TableHead className="hidden text-xs font-medium text-muted-foreground sm:table-cell sm:text-sm">
                Expected Close
              </TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDeals.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No deals found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              paginatedDeals.map((deal, index) => (
                <TableRow key={deal.id}>
                  <TableCell className="text-xs font-medium sm:text-sm">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold text-white sm:size-[26px] sm:rounded-lg sm:text-sm ${deal.dealColor}`}
                      >
                        {deal.dealInitial}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-medium sm:text-sm">
                          {deal.dealName}
                        </span>
                        <span className="text-[10px] text-muted-foreground md:hidden">
                          {deal.client}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:text-sm md:table-cell">
                    {deal.client}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-muted/80 text-[10px] font-medium text-muted-foreground sm:text-xs"
                    >
                      {deal.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground sm:text-sm">
                    ${numberFormatter.format(deal.value)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 bg-muted sm:size-6">
                        <AvatarFallback className="text-[8px] font-extrabold uppercase text-muted-foreground sm:text-[10px]">
                          {deal.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        {deal.owner}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell sm:text-sm">
                    {deal.expectedClose}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground sm:size-8"
                        >
                          <MoreHorizontal className="size-3.5 sm:size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 size-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 size-4" />
                          Edit Deal
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t px-3 py-3 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span className="hidden sm:inline">Rows per page:</span>
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">
            {filteredDeals.length === 0
              ? "0 of 0"
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  filteredDeals.length
                )} of ${filteredDeals.length}`}
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


