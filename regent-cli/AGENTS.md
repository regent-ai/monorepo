# Regent CLI (`monorepo/regent-cli/`)

This folder hosts **Regent CLI packages** that were previously under `monorepo/regent-sdk/regent-sdk/packages/`.

## Package manager

- Use **Bun**: `bun install`, `bun run <script>`

## Workspace layout

- `packages/cli/` — `@regent/cli` (scaffolding CLI; bins: `regent`, `create-agent-kit`)
- `packages/regentx/` — `@regent/regentx` (agent management CLI; bin: `regentx`)
- `packages/{tsconfig.base.json,tsconfig.build.base.json,tsup.config.base.ts}` — shared TS build config (copied from the SDK workspace)

## Notes

- These CLI packages depend on Regent SDK packages (e.g. `@regent/agents`, `@regent/wallet`).
- For local dev, this workspace includes the SDK packages via `workspaces.packages`:
  - `../regent-sdk/regent-sdk/packages/*`


