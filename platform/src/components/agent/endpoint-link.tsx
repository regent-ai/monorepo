import { ExternalLink } from "lucide-react";

export function EndpointLink({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/50"
    >
      <div>
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="max-w-[200px] truncate font-mono text-sm">{url}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}
