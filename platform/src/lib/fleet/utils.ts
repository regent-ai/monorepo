/** Maps fleet status to badge variant */
export function fleetStatusToBadgeVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "blocked":
      return "destructive";
    case "executing":
      return "default";
    case "waiting":
      return "outline";
    case "complete":
    case "idle":
      return "secondary";
    default:
      return "outline";
  }
}
