import { ChevronRight } from "lucide-react";

export function PageSizeSelect({
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
