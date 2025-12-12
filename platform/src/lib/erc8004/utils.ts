/** Available page size options (multiples of 3 for grid layout) */
export const PAGE_SIZES = [12, 24, 48, 99];

/** Default page size */
export const DEFAULT_PAGE_SIZE = 24;

/** Truncates an Ethereum address to "0x1234...5678" format */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Converts Unix timestamp to readable date */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Checks if a string contains mostly readable ASCII characters */
export function isReadableText(str: string | null): boolean {
  if (!str) return false;
  const nonReadable = str
    .split("")
    .filter((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126).length;
  return nonReadable / str.length < 0.3;
}
