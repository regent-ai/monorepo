import { ChevronDown, Download, FileText, Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function WelcomeSection() {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
      <div className="space-y-2 sm:space-y-5">
        <h2 className="text-lg font-semibold leading-relaxed sm:text-[22px]">
          Regent Agent Dashboard
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          <span className="font-medium text-foreground">0 agents</span> active •{" "}
          <span className="font-medium text-foreground">$0.00</span> x402 income •{" "}
          <span className="font-medium text-foreground">0</span> new reviews
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs sm:h-9 sm:gap-3 sm:text-sm"
            >
              <span className="hidden xs:inline">Exports</span>
              <span className="xs:hidden">
                <Download className="size-4" />
              </span>
              <ChevronDown className="size-3 text-muted-foreground sm:size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="mr-2 size-4" />
              Export agents (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 size-4" />
              Export x402 income (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="mr-2 size-4" />
              Export report (PDF)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button asChild size="sm" className="h-8 gap-2 sm:h-9 sm:gap-3 sm:text-sm">
          <a href="/explorer">
            <Plus className="size-3 sm:size-4" />
            <span className="hidden xs:inline">Explore agents</span>
            <span className="xs:hidden">Explore</span>
          </a>
        </Button>
      </div>
    </div>
  );
}


