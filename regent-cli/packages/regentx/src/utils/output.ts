/**
 * Output formatting utilities
 */

/**
 * Format output as JSON or human-readable table
 */
export function formatOutput(
  data: Record<string, unknown>,
  options: { json?: boolean }
): string {
  if (options.json) {
    return JSON.stringify(data, null, 2);
  }

  const lines: string[] = [];
  const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));

  for (const [key, value] of Object.entries(data)) {
    const paddedKey = key.padEnd(maxKeyLength);
    const formattedValue = formatValue(value);
    lines.push(`${paddedKey}  ${formattedValue}`);
  }

  return lines.join('\n');
}

/**
 * Format a single value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Print a success message
 */
export function printSuccess(message: string): void {
  console.log(`✓ ${message}`);
}

/**
 * Print an error message
 */
export function printError(message: string): void {
  console.error(`✗ ${message}`);
}

/**
 * Print a warning message
 */
export function printWarning(message: string): void {
  console.warn(`⚠ ${message}`);
}

/**
 * Print a table of items
 */
export function printTable(
  items: Record<string, unknown>[],
  columns: { key: string; header: string; width?: number }[]
): void {
  if (items.length === 0) {
    console.log('(no items)');
    return;
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerWidth = col.header.length;
    const maxValueWidth = Math.max(
      ...items.map((item) => String(item[col.key] ?? '').length)
    );
    return col.width ?? Math.max(headerWidth, maxValueWidth);
  });

  // Print header
  const header = columns
    .map((col, i) => col.header.padEnd(widths[i]))
    .join('  ');
  console.log(header);
  console.log('-'.repeat(header.length));

  // Print rows
  for (const item of items) {
    const row = columns
      .map((col, i) => String(item[col.key] ?? '-').padEnd(widths[i]))
      .join('  ');
    console.log(row);
  }
}
