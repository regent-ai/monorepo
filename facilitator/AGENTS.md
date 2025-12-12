# Facilitator

Express server that processes x402 payments and routes them to agents.

Endpoints:
- `POST /verify` - Validate payment requirements
- `POST /settle` - Settle payments on-chain
- `POST /register` - Register agent identity via EIP-7702
- `GET /supported` - Supported kinds grouped by version + signer registry + extensions
- `POST /discover` - Crawl discovery-enabled resources (PAYMENT-REQUIRED header) and store in local catalog
- `GET /catalog` - Read discovery catalog snapshot

Key behavior:
- Generates `feedbackAuth` after v2 settlement for authenticated reputation feedback (via feedback extension).
- Supports multi-network EVM v2 (Base Sepolia + Base Mainnet) via per-network RPC config.
