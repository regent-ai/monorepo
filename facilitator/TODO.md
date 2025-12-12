# Facilitator TODO

## Current

- **Implement client-facing feedback path (v2)**: `index.ts` generates and stores `feedbackAuth` in-memory (`feedbackAuthStore`) in the `feedback` extension `onAfterSettle` hook, but there is no route or response field that returns it to clients (see `index.ts` around `facilitator.registerExtension("feedback").onAfterSettle(...)` and the `feedbackAuthStore` map). Consider either:
  - returning `feedbackAuth` in the **settle response extension payload**, or
  - adding a `POST /feedback` route that uses stored `feedbackAuth`, matching the repo’s intent (see `README.md` and `flow.png`).

- **Fix fallback signing key for feedbackAuth**: `src/services/feedbackService.ts` builds the `FeedbackAuth` struct with `signerAddress = ownerOf(agentId)` but falls back to signing with `FACILITATOR_PRIVATE_KEY`. Unless the facilitator key == agent owner key, this produces an invalid signature. Prefer requiring the agent server signer, or introduce a clear “agent signer key” config explicitly.

- **Decide on v1 feedbackAuth support**: `index.ts` has a TODO noting v1 settlement doesn’t generate feedbackAuth. Either implement v1 feedback auth flow (and store/return it), or remove v1-related stores if v2-only is the direction.

## Completed

- **Repo walkthrough skeleton captured**: Key flows identified (`/verify`, `/settle`, `/register`, feedback extension hook), plus example server integration points (`examples/v1-server`, `examples/v2-server`) for registration + feedback signing.

- **Honor `feedbackAuthEndpoint` from the x402 extension**: Facilitator now passes a full signing URL and `feedbackService` calls that URL directly.

- **Wire RPC URLs consistently (multi-network)**: Facilitator now supports per-network RPC via `RPC_URLS_JSON` and routes all Viem clients through `getRpcUrlForNetwork()`.

- **Align `/health` extensions + networks**: `/health` now returns `networks` and uses the facilitator’s registered extension list.

## Notes

- **Design intent reference**: `flow.png` documents the intended “register → pay → settle → sign feedback hash → store auth → feedback via 7702 → giveFeedback()” lifecycle.
- **External reference**: Upstream repo is `open-mid/8004-facilitator` (keep changes scoped to this repo clone).


