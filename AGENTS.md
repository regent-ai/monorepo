## Regent `monorepo/` scope rules (read first)

This directory is the **monorepo root** for Regent — a **single git repository** (`monorepo/.git`).

Top-level projects:

- `platform/` — web app (regent.cx)
- `facilitator/` — x402 payment router + settlement service
- `regent-sdk/` — Regent SDKs (agents runtime + x402 + ERC-8004 tooling)
- `regent-cli/` — Regent CLIs (scaffolding + agent management)
- `documentation/` — GitBook docs repo

Preserved upstream mirrors (remain separate git repos; ignored by this monorepo’s `.gitignore`):

- `regent-sdk/lucid-agents/` (upstream: daydreamsai/lucid-agents)
- `regent-sdk/agent0-ts/` (upstream: agent0lab/agent0-ts)

GitBook docs (tracked separately; ignored by this monorepo’s `.gitignore`):

- `documentation/` (GitBook sync)

Other workspace folders:

- `contracts/` — placeholder for a future standalone contracts repo (active Foundry project currently lives under `teaser-web/contracts/`)
- `news/` — drafts for posts (Paragraph/redirected)
- `agents/` — placeholder for flagship agents

### Scope / “don’t wander” rules

- **Default scope is one project folder**: when given a task, pick the *single* owner directory and keep changes inside it.
- **Cross-project changes require explicit intent**:
  - Only touch a second project folder if the task cannot be completed otherwise (build break, contract mismatch, shared types, etc.).
  - Keep cross-project changes minimal and call out the dependency in your summary.
- **Avoid repo-wide refactors** unless explicitly requested.

### Where to put new files

- **Project-specific** docs/code live inside the owning folder (`platform/`, `facilitator/`, `regent-sdk/`, etc.).
- **Monorepo-wide** coordination docs live here (`monorepo/`).

### Package management

- Use **Bun** for JS/TS work: `bun install`, `bun run <script>`.
- Avoid `npm`, `pnpm`, and `yarn` unless a repo explicitly requires it.

### Task tracking

- Follow the **nearest** `AGENTS.md` inside each project folder (they may have project-specific tracking rules).
- Use **bd (beads)** for all tracking:
  - Check ready work: `bd ready --json`
  - Create/track issues: `bd create ... --json`, `bd update ... --json`, `bd close ... --json`
  - Prefer the **nearest** `.beads/` project (folder-local). For cross-project work, use the workspace root project at `/Users/sean/Documents/regent/.beads/`.

### Safety

- Don’t start long-running servers unless explicitly asked.
- Prefer absolute paths in commands and tool calls.

### Changelog

- Keep `monorepo/CHANGELOG.md` updated for notable changes across this monorepo.
- When you add a changelog entry, also add a **single-line** summary below with the **directory affected**.
- In addition, each project folder should keep its own `CHANGELOG.md` for changes **within that folder only** (do not log cross-project changes there).

#### Changelog summaries (single line)

- `monorepo/`: v0.1.0 — Baseline monorepo changelog created with top-level project layout.
- `documentation/`: v0.1.1 — Migrated Regent SDK docs into GitBook, added missing docs sections, modeled builder unlock curve, and embedded section header images.


