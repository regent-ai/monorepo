import { createFileRoute } from "@tanstack/react-router";

import { ExternalLink } from "lucide-react";

import { Button } from "~/components/ui/button";

const DOCS_URL = "https://docs.regent.cx";

export const Route = createFileRoute("/docs")({
  component: DocsRoute,
});

function DocsRoute() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6 lg:p-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Docs</h1>
        <p className="text-sm text-muted-foreground">
          Regent documentation lives at {DOCS_URL}.
        </p>
      </header>

      <section className="rounded-xl border bg-background/60 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Open documentation</p>
            <p className="text-xs text-muted-foreground">{DOCS_URL}</p>
          </div>
          <Button asChild>
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
              Open docs
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}


