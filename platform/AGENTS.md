## Package Manager

**Use Bun for all package management and script execution.**

```bash
# Install dependencies
bun install

# Run scripts
bun run dev
bun run build
bun run check-types

# Add packages
bun add <package>
bun add -d <dev-package>
```

Do NOT use npm, yarn, or pnpm.

---

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask (gets ID like epic-id.1)
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### GitHub Copilot Integration

If using GitHub Copilot, also create `.github/copilot-instructions.md` for automatic instruction loading.
Run `bd onboard` to get the content, or see step 2 of the onboard instructions.

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):
```json
{
  "beads": {
    "command": "beads-mcp",
    "args": []
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**
- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**
```
# AI planning documents (ephemeral)
history/
```

**Benefits:**
- Clean repository root
- Clear separation between ephemeral and permanent documentation
- Easy to exclude from version control if desired
- Preserves planning history for archeological research
- Reduces noise when browsing the project

### CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- Use bd for ALL task tracking
- Always use `--json` flag for programmatic use
- Link discovered work with `discovered-from` dependencies
- Check `bd ready` before asking "what should I work on?"
- Store AI planning docs in `history/` directory
- Run `bd <cmd> --help` to discover available flags
- Do NOT create markdown TODO lists
- Do NOT use external issue trackers
- Do NOT duplicate tracking systems
- Do NOT clutter repo root with planning documents

For more details, see README.md and QUICKSTART.md.

---

## Fleet ops integration (platform ↔ fleet-dashboard)

### Routes

- **`/dashboard`**: Fleet ops aggregate dashboard (joins ERC-8004 agents with fleet tenant status).
- **`/agent/$id?tab=ops`**: Per-agent ops tab inside the existing agent profile route.
  - `$id` is the ERC-8004 subgraph `Agent.id` in **`chainId:tokenId`** format (numeric:numeric).

### Platform env

- **Server** (`monorepo/platform/src/env/server.ts`)
  - **`FLEET_API_BASE_URL`**: Base URL for the fleet backend HTTP API (e.g. `https://fleet-api.regent.cx`).
  - **`FLEET_ADMIN_TOKEN`** (optional): Enables admin proxy endpoints (ensure tenant, send chat) by forwarding `Authorization: Bearer <token>`.
- **Client** (`monorepo/platform/src/env/client.ts`)
  - **`VITE_FLEET_WS_BASE_URL`** (optional): Base URL for fleet backend WebSockets (e.g. `wss://fleet-api.regent.cx`).

### Proxy/API surface (platform server → fleet backend)

Implemented under `monorepo/platform/server/routes/api/fleet/`:

- **Public (read-only)**: `GET /api/fleet/tenants`, `GET /api/fleet/agent/:erc8004Id/{info,agents,events,chat}`
- **Admin**: `POST /api/fleet/agent/:erc8004Id/{ensure,chat/send}` (requires `FLEET_ADMIN_TOKEN`)

### Client helpers

- **`monorepo/platform/src/lib/fleet/api.ts`**: typed fetchers for platform proxy routes
- **`monorepo/platform/src/lib/fleet/ws.ts`**: `useFleetWebSocket({ erc8004Id })` for tenant WS subscriptions

---

## Explorer route (`/explorer`) notes

- **Route file**: `monorepo/platform/src/routes/explorer.tsx`
  - Uses TanStack Router **optional** search params (defaults are applied in-code):
    - `view`: `grid | list`
    - `mode`: `all | regent`
    - `sort`: `newest | mostReviews | name`
    - `search`: string
    - `hasReviews`, `hasEndpoint`: booleans
    - `page`, `perPage`: numbers (list view)
  - Loads an initial batch (`GRID_INITIAL_BATCH_SIZE`) and incrementally loads more when needed.
  - Clicking a card opens a **Dialog modal** preview (Escape closes); “Open full profile” navigates to `/agent/$id`.

- **Infinite grid**: `monorepo/platform/src/lib/thiings-grid.tsx`
  - Exposes `publicGetCurrentPosition()`, `publicSetCurrentPosition()`, `publicResetPosition()`
  - Emits `onVisibleRangeChange({ minIndex, maxIndex, offset })` for prefetch/load-more triggers.
