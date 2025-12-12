// src/routes/redeem.tsx
import { createFileRoute } from "@tanstack/react-router";
import { RedeemWidget } from "@/components/redeem/redeem-widget";

export const Route = createFileRoute("/redeem")({
  component: RedeemPage,
});

function RedeemPage() {
  return (
    <main className="flex flex-col gap-8 p-6 lg:p-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Redeem Animata Passes for $REGENT
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Connect your wallet on Base, select your Animata token, and redeem
            for 5M $REGENT streamed over 7 days.
          </p>
        </div>
      </header>

      {/* Full redeem experience (Permit2 + classic path + prechecks) */}
      <section className="rounded-xl border bg-background/60 p-4 shadow-sm sm:p-6 lg:p-8">
        <RedeemWidget variant="full" />
      </section>
    </main>
  );
}
