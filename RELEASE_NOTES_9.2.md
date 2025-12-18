# Release Notes — v9.2

## Overview
v9.2 sharpens the ΦNet Sovereign Gate experience with sturdier sigil discovery, production-safe startup behavior, and a cooled-down, lineage-consistent chakra palette. Developers also get typed valuation plumbing and a small test harness to keep Kai pulse math verified.

## Highlights
- **Sigil Explorer reliability:** HTTPS fallback and idle-friendly sync keep registry pulls stable on secure pages and mobile scroll contexts.
- **Production-safe boot:** Legacy hash rewriting and service worker registration now run only in production, avoiding surprise rewrites during local work.
- **Valuation safety:** Typed inputs and stable hashing reduce accidental `any` leaks and make price flash updates deterministic.
- **Perf-aware UI:** Low-power devices and reduced-motion preferences automatically drop into a lighter visual mode via `data-perf="low"` toggling on the document root.
- **Test coverage starter:** A Node-based test runner exercises `kai_pulse` invariants to guard against regressions in the Kai time engine.

## User-facing changes
- **Verifier & sigil surfaces** retain the warm sacral/solar palette via chakra color tokens, restoring the original Atlantean chrome for stamps and sunrise visuals.
- **Sigil Explorer** now falls back to the HTTPS LAH-MAH-TOR host (`https://m.kai`) when the primary registry is unreachable, preventing mixed-content blocks on secure origins.
- **Hash rewrite guard** only normalizes legacy `/stream/p/:token?add=` links in production builds, keeping local dev URLs intact.
- **Service worker** registration is likewise production-gated, so local work avoids redundant registration logs and cache interference.

## Developer-facing changes
- **Valuation hook** now builds `ValueSeal` objects from a typed `SigilMetadataLite` payload and caches hash calculations to prevent redundant state churn while keeping explainers (rarity, oscillation, lineage) intact.
- **Kai time display helpers** factor pulse formatting and modular arithmetic into a tiny utility, simplifying beat/step rendering across the app shell.
- **Low-power detection** inspects reduced-motion and reduced-transparency media queries alongside device memory / hardware concurrency to automatically set `data-perf="low"`.
- **Kai pulse tests** run under Node’s built-in test runner, transpiling the TypeScript module on the fly to assert pulse/beat calendar invariants.

## Upgrade notes
- No config schema changes in 9.2. Existing `.env` keys continue to apply (e.g., `VITE_KAI_PULSE_ORIGIN`, `VITE_PHI_API_BASE_URL`, `VITE_PHI_EXPLORER_URL`).
- To keep Sigil Explorer imports hydrated, allow outgoing HTTPS traffic to `https://align.kaiklok.com` and `https://m.kai`.

## Known issues
- The Sigil Explorer still caps single sync runs to 120k URLs for safety; extremely large registries may require multiple breaths to hydrate fully.
- QR/export visuals add a deterministic hue offset per sigil hash to reduce banding; slight variance from the base chakra accent is expected.

## Testing
- `npm run build` (passes)

