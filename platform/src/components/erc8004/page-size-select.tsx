"use client";

import { useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "~/lib/erc8004/utils";

interface PageSizeSelectProps {
  currentSize: number;
  sizes: number[];
  currentSearch: {
    search?: string;
    hasReviews?: boolean;
    hasEndpoint?: boolean;
  };
}

export function PageSizeSelect({
  currentSize,
  sizes,
  currentSearch,
}: PageSizeSelectProps) {
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);

    navigate({
      to: "/",
      search: {
        ...currentSearch,
        page: 1, // Reset to page 1 when changing page size
        perPage: newSize === DEFAULT_PAGE_SIZE ? undefined : newSize,
      },
    });
  };

  return (
    <div className="relative">
      <select
        value={currentSize}
        onChange={handleChange}
        className="appearance-none rounded-lg border border-border bg-card px-3 py-1.5 pr-8 text-sm text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary/30"
      >
        {sizes.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
