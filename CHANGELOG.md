# Changelog

This changelog tracks notable changes across the Regent monorepo workspace under `monorepo/`.

## v0.1.1 (2025-12-12)

- **Documentation (`monorepo/documentation/`, `monorepo/regent-sdk/regent-sdk/documentation/`)**: Migrated Regent SDK docs into the GitBook docs repo, added missing architecture/protocol/platform/MCP/agent catalog sections, modeled builder unlock curve (CSV + SVG), and added section header images; removed the old `monorepo/regent-sdk/regent-sdk/documentation/` copy to prevent drift.
- **Docs conventions (`monorepo/documentation/`)**: Established/updated documentation repo structure and navigation (`SUMMARY.md`) and added docs-local changelog + conventions.

## v0.1.0 (2025-12-12)

Initial monorepo changelog and high-level project layout:

- **`platform/`**: Regent web application (regent.cx).
- **`facilitator/`**: x402 payment verification + on-chain settlement + identity/reputation extensions.
- **`regent-sdk/`**: TypeScript SDKs and runtimes for Regent-native agents (x402 + ERC-8004 tooling).
- **`regent-cli/`**: CLI for launching Regent-native agents (TEE + x402 + ERC-8004 tooling).
- **`documentation/`**: GitBook documentation repository (tracked separately).
- **`news`**: Posts for news.regent.cx

