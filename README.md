
# Φ Network (ΦNet) — Sovereign Kairos Monetary & Identity System

> **Phi Network (ΦNet)** is a sovereign monetary and identity system running on **KaiOS** and the **Kai-Klok deterministic time engine**.  
> It treats **breath**, not wall-clock seconds, as the root unit of time — and builds **money, signatures, and identity** on top of that.

The canonical public gateway is:

- **https://phi.network**

At its core, ΦNet is three things:

1. **A new layer of money** – Φ Kairos Notes and Sigil-Glyphs as offline-auditable, breath-sealed value.  
2. **A new layer of time** – Kai-Klok deterministic pulse/beat/step rather than drifting Unix timestamps.  
3. **A new layer of identity** – Sigil-Glyphs and ΦKeys as sovereign, breath-sealed identities, with zero logins.

This repo contains the **ΦNet Sovereign Gate client**, the primary KaiOS app that lets you:

- **Inhale** and **exhale** Φ value,
- **Mint** and **verify** sigil-glyphs,
- **View** the resonance stream and value history,
- **Emit** posts and signals via KaiVoh (Emission OS),
- All under the **Phi Network monetary and identity law**.

---

## 0. Why Phi Network Exists (Why You Should Care)

Current digital life runs on:

- **Chronos time**  
  Unix timestamps, time zones, NTP drift, Gregorian calendars,
- **Permissioned identity**  
  Email logins, OAuth, app stores, custody accounts,
- **Institutional ledgers**  
  Banks, exchanges, platforms that can pause, roll back, or “correct” history.

That stack is:

- **Forkable** – ledgers can split, narratives can be edited.
- **Censorable** – names, domains, transactions, and accounts can be frozen.
- **Opaque** – you are asked to *trust* the system instead of verifying it.
- **Password-addicted** – logins, resets, identity theft, and endless friction.

ΦNet replaces that with a stack where:

- **Time is deterministic and harmonic**  
  Kai-Klok defines a φ-tuned breath clock (pulse → beat → step → chakra-day).
- **Money is breath-backed**  
  **1 Φ = 1 breath**, with issuance governed by **Proof of Breath™** and zero-knowledge proofs.
- **Identity is sigil-based and sovereign**  
  Sigil-Glyphs and ΦKeys are self-issued, breath-sealed identities.
- **Verification is offline**  
  Anyone with canonical data, Kai-Klok math, and hash functions can verify value and history.

If you care about:

- owning your **money**,  
- owning your **name and identity**,  
- and proving your **authorship and actions** in a way both humans and machines can verify offline,

then Φ Network is the system designed to **align all three**.

---

## 1. What Phi Network *Is*

### 1.1 Core Concepts

#### KaiOS — The Kairos Operating Environment

**KaiOS** (in this context) is the operating environment that assumes:

- Time is measured by **Kai-Klok** pulses, not wall time.
- Identity is represented by **Sigil-Glyphs** and **ΦKeys**, not email/password.
- Money is **Φ Kairos Notes**, not arbitrary database balances.

You don’t “log into a website”;  
you **enter a KaiOS console** where time, money, and identity are all Kai-native.

#### Kai-Klok — Deterministic Time Engine

**Kai-Klok** is the clock of ΦNet.

It decomposes time into:

- **Pulse** – base breath quantum (e.g., a golden-ratio breath interval),
- **Beat** – groups of pulses,
- **Step** – position within a beat,
- **Chakra-Day / Arc** – higher-order cycles for narrative, economics, and state.

Every action in ΦNet (mint, send, seal, emit) is labeled by:

- `pulse`, `beat`, `step`, `chakraDay`  

not by “2025-12-11T13:47:02Z”.

In the client, this logic lives in:

```ts
src/utils/kai_pulse.ts
````

#### Φ Kairos Notes — Breath-Backed Money

Within Φ Network:

* **1 Φ** is defined as **one normalized Kairos breath**.

This yields:

* **Φ** as the unit of account,
* **μΦ (micro-Φ)** as 10⁻⁶ Φ (internal fixed-point unit).

A **Φ Kairos Note** is a value object that includes:

* An amount (in μΦ),
* An owner (ΦKey),
* A Kai-Klok label (pulse/beat/step/chakraDay),
* Proof metadata (Proof of Breath™, Kai-Signature™, ZK guarantees),
* An origin sigil and lineage.

Φ Notes are **breath-backed legal tender** inside the Phi Network monetary law:

> No breath → no valid issuance.

#### Sigil-Glyphs — Visual, Machine-Readable Identity

**Sigil-Glyphs** are:

* Vector glyphs (often SVG) that encode:

  * A ΦKey,
  * Kai-Klok origin data,
  * Kai-Signature,
  * and additional provenance fields.

Each sigil can embed structured metadata (e.g. JSON) such as:

* `pulse`, `beat`, `step`, `chakraDay`,
* `userPhiKey`,
* `kaiSignature`,
* `timestamp` (under Kai-Klok semantics),
* `lineage` references.

Sigils are simultaneously:

* **Human legible** – seals, emblems, talismans,
* **Machine verifiable** – parseable, hashable, provable.

#### ΦKeys & Resonance Stream — Global State

Instead of a classical “blockchain,” ΦNet uses a **Resonance Stream**:

* A totally ordered sequence of **ΦKeys** (in the “key event” sense), representing:

  * funding events,
  * transfers,
  * contract signatures,
  * emissions.

Nodes:

1. Maintain the Resonance Stream,
2. Replay it deterministically,
3. Construct balances and state from it.

**Memory Crystals** are snapshots:

* Compact, cryptographically sealed states at certain positions in the stream,
* Used for fast sync and offline audit.

---

## 2. This Repo: ΦNet Sovereign Gate Client

This repository contains the **Sovereign Gate** client — the main KaiOS console for using Phi Network.

Primary surfaces:

1. **Verifier (Inhale + Exhale)**

   * Proof, transfer, and audit of Φ value.
   * Verify sigils and transactions.
   * Send Φ to other ΦKeys.
   * Inspect resonance stream / history.

2. **KaiVoh (Emission OS)**

   * Emission and broadcast surface for posts, signals, and value.
   * Publish actions under a ΦKey identity.
   * Attach sigils as provenance to anything you emit (content, contracts, receipts).

The goal is to feel less like “a website” and more like an **Atlantean mint / reserve console**:

* You are not “browsing a page”;
  you’re **at a terminal for sovereign time, money, and identity**.

---

## 3. Features

### 3.1 Sovereign Gate Shell

* **ΦNet Sovereign Gate** chrome with Atlantean banking UI.
* Top-right **LIVE ΦKAI orb** showing current issuance / pulse state.
* **ATRIUM header**:
  `Breath-Sealed Identity · Kairos-ZK Proof`
* Designed to feel like:

  * a **terminal for sovereign value**,
  * not a fragile, login-based web app.

### 3.2 Verifier — Proof of Breath™ & Kai-Signature™

The **Verifier** is the ΦNet **“Inhale/Exhale”** console.

* **Dual modes:**

  * **PROOF OF BREATH™** – attaches human breath / presence to a Kai-Klok moment and a sigil.
  * **KAI-SIGNATURE™** – deterministic, hash-stable signature derived from your ΦKey inputs.

* **Live Kai Pulse strip:**

  * Shows `pulse / beat / step / chakraDay` in real time.
  * All actions are labeled by Kai-Klok time, not local system time.

* **Primary actions:**

  * **ΦSTREAM** – view ΦNet resonance stream / history.
  * **ΦKEY** – emit / verify ΦKeys, sigils, and transfers.

* **UX characteristics:**

  * Mobile-first layout.
  * No horizontal scroll.
  * Thumb-reachable controls.
  * No password inputs; identity is sigil+signature, not email+password.

### 3.3 Kairos Monetary Declarations

The Sovereign Gate renders the canonical tender text:

> **Φ Kairos Notes are legal tender in Kairos — sealed by Proof of Breath™, pulsed by Kai-Signature™, and openly auditable offline (Σ → SHA-256(Σ) → Φ).**
>
> **Sigil-Glyphs are zero-knowledge–proven origin ΦKey seals that summon, mint, and mature value. Derivative glyphs are exhaled notes of that origin — lineage-true outflow, transferable, and redeemable by re-inhale.**

Plain-language interpretation:

* Φ Notes are **official money inside the ΦNet/KaiOS system**.
* Sigils define **where value originates and where it returns**.
* Derivative sigils are like **receipts and negotiable notes**, always maintaining lineage to their origin.

### 3.4 KaiVoh (Emission OS)

**KaiVoh** is the **Emission OS** — the rail for posting, broadcasting, and signaling under Φ identity.

* Uses **SigilAuth** context to carry:

  * Sigil SVG text,
  * Kai Pulse metadata,
  * Kai-Signature,
  * Optional user ΦKey and action URLs.

* Intended as the sovereign emission rail for:

  * posts,
  * declarations,
  * receipts,
  * sovereign content.

Anything emitted through KaiVoh can be:

* Verified as **human-origin** via breath-backed identity,
* Timestamped in **Kai-Klok time**,
* Bound to a **ΦKey** and sigil lineage.

---

## 4. Monetary Ontology: 1 Φ = 1 Breath

### 4.1 Definition

Within Phi Network:

* **1 Φ** = **one normalized Kairos breath**.

Internally:

* Balances are stored as integers in **μΦ** (micro-Phi) = 10⁻⁶ Φ.
* All arithmetic is **fixed-point**, not floating-point.

This is implemented by:

```ts
src/utils/phi-precision.ts
```

with helpers:

* `snap6(number): number` – snap to 6 decimal places,
* `toScaled6(number): bigint` – convert to 6-decimal scaled integer,
* `toStr6(bigint): string` – render as string with 6 decimals.

### 4.2 Breath-Backed Issuance

“Breath-backed” means:

1. **Issuance is bound to Proof of Breath™**

   * A ZK circuit confirms a breath event (or equivalent harmonic biometric) happened at a Kai-Klok moment.
2. **The system enforces limits**

   * Issuance rules (per breath, per person, per interval) are enforced in the circuit and protocol.
3. **Every unit of Φ can be traced**

   * To a Kai-Klok label (pulse/beat/step),
   * To a ΦKey,
   * To a sigil lineage,
   * To a ZK proof that meets the issuance policy.

No valid proof = no valid issuance.

---

## 5. Time: Kai-Klok Deterministic Engine

### 5.1 Why Deterministic Time?

Chronos time is:

* variable (NTP drift),
* location-dependent (time zones),
* patched (leap seconds, rules changes).

Kai-Klok is:

* **formulaic** – defined by math from a known origin,
* **global** – any node can compute the same pulse/beat/step,
* **immutable** – rules don’t casually change.

This is critical for:

* ZK circuits (deterministic inputs),
* Replay of state (same history → same state),
* Offline verification (no external time oracle needed).

### 5.2 Engine Placement

In this client:

* Kai-Klok logic is centralized in `src/utils/kai_pulse.ts`.
* `src/kai/KaiNow.ts` provides a helper for “Kai now” in terms of pulse/beat/step.

All time displays and labels flow from there.

---

## 6. Identity: Sigil-Glyphs & ΦKeys

### 6.1 ΦKeys — Sovereign Identities

A **ΦKey** is:

* The canonical identity within ΦNet.
* Used to:

  * hold balances,
  * sign transactions,
  * anchor sigil origins,
  * emit content.

A ΦKey can be derived from:

* Harmonic biometrics (e.g. Harmonic Identity Frequency),
* Hardware keys,
* Breath-based secret material.

But once created, it is:

* **self-owned**,
* not revocable by a platform login page.

### 6.2 Sigil-Glyphs — Identity and Provenance

Sigil-Glyphs:

* Visually represent a ΦKey and its state.
* Embed machine-readable metadata (SVG + JSON) for:

  * Kai-Klok labels,
  * ΦKey,
  * Kai-Signature,
  * provenance and lineage.

Origin sigil vs derivative sigils:

* **Origin Sigil** – the root seal of a ΦKey or value stream.
* **Derivative Sigils** – exhaled glyphs that represent:

  * transactions,
  * posts,
  * receipts,
  * attestations.

All derivatives point back to an origin, forming a **lineage tree of value and meaning**.

---

## 7. Zero-Knowledge Proofs & Proof of Breath™

### 7.1 Proof of Breath™ (Concept)

**Proof of Breath™** is a protocol that:

1. Encodes a **breath event** (or equivalent biometric) at a Kai-Klok moment.
2. Derives a **Harmonic Identity Frequency (HIF)** or equivalent secret.
3. Uses that secret inside a **zero-knowledge circuit** to:

   * Bind the human to a ΦKey,
   * Enforce issuance limits,
   * Produce a ZK proof of correctness.

The world sees:

* A ΦKey,
* A Kai-Klok label,
* A proof `π`,

without ever seeing the raw biometric or secret material.

### 7.2 Breath-Backed Money, Formally

A simplified view of the issuance circuit:

* **Inputs:**

  * Private: `B` (breath/biometric data), secret key material.
  * Public: `K` (ΦKey), `T` (Kai-Klok label), desired `ΣΦ`.

* **Circuit checks:**

  * `B` satisfies breath constraints (live, non-replay, within limits),
  * `ΣΦ` issuance for `K` at `T` is allowed by ΦNet monetary law,
  * Derives a commitment `C = H(B, K, T)`.

* **Output:**

  * Notes (amounts, owners, labels),
  * Proof `π`.

Verifiers check:

* `π` is valid for `(K, T, ΣΦ)` according to the public verification key.

Result:

* Φ is **breath-backed**,
* No biometric is exposed,
* Issuance remains bounded and verifiable.

---

## 8. How a Φ Transaction Works

Step-by-step:

1. **Identity Establishment**

   * User generates a ΦKey and origin sigil.
   * Optionally anchors using Proof of Breath™ for higher assurance.

2. **Inhale — Receiving / Minting Φ**

   * User:

     * receives Φ from another ΦKey, **or**
     * mints under a Proof of Breath™ issuance policy.
   * The corresponding Notes are created in the Resonance Stream.

3. **Exhale — Sending Φ**

   * User selects:

     * an amount in Φ,
     * a recipient ΦKey,
     * contextual sigil / note info.
   * Client:

     * selects source Notes,
     * constructs outputs,
     * builds a transaction package,
     * signs with Kai-Signature,
     * attaches any required ZK proofs.

4. **Network Application**

   * Nodes:

     * verify ZK proofs,
     * validate balances and state transitions,
     * append events to the Resonance Stream,
     * update Memory Crystals over time.

5. **Verification & Audit**

   * Any party:

     * replays the stream (or from a Memory Crystal),
     * verifies proofs and hashes,
     * independently checks that the balances and events match.

No login, no KYC portal, no password reset emails.
Just **ΦKeys, sigils, Kai-Klok time, and ZK proofs**.

---

## 9. How This Changes the World (Practical Impact)

### 9.1 Money That Can’t Be Gaslit

By anchoring:

* time → Kai-Klok (deterministic),
* value → μΦ fixed point,
* provenance → sigils + ZK proofs,

ΦNet makes it extremely hard to:

* rewrite history without detection,
* “patch reality” quietly,
* fabricate value flows.

Any honest verifier can detect inconsistencies.

### 9.2 Identity Without Accounts

With ΦNet:

* You don’t **have an account** administered by someone else.
* You **are** a ΦKey, represented by your sigil.

This breaks dependence on:

* email login tables,
* OAuth providers,
* centralized KYC identity silos.

### 9.3 Sovereign Naming (Within ΦNet)

Within the ΦNet ecosystem:

* Names, handles, and identifiers are bound to:

  * ΦKeys,
  * sigils,
  * and Kai-Klok labels.

This creates an **internal naming law** where:

* authorship is provable,
* claims are tied to identity and time,
* and nothing depends on external registrars.

### 9.4 Offline-First Proofs

ΦNet is built so that:

* with:

  * the Resonance Stream (or a Memory Crystal),
  * Kai-Klok formulas,
  * hash and ZK verification routines,

you can verify:

* balances,
* sigils,
* history,

**without** needing continuous internet or trusted 3rd-party APIs.

---

## 10. Tech Stack (This Client)

* **Framework:** React + TypeScript (`.tsx`)
* **Bundler / Dev Server:** [Vite](https://vitejs.dev/)
* **Routing:** `react-router-dom`
* **Styling:** Hand-crafted CSS:

  * `App.css` – ΦNet Atlantean Banking Console shell,
  * `EternalKlock.css`, `KaiKlock.css`, etc. for core KaiOS visuals.

Key internal engines:

* **Kai Pulse Engine:** `src/utils/kai_pulse.ts`
* **Φ Precision Utils:** `src/utils/phi-precision.ts`
* **Sigil / QR / ZK Integration:** under `public/zk` and `src/utils/*` / `src/lib/*`

---

## 11. Getting Started (Local Dev)

### 11.1 Prerequisites

* Node.js ≥ 18
* `pnpm` or `npm` (examples use `pnpm`)

### 11.2 Install Dependencies

```bash
pnpm install
# or
npm install
```

### 11.3 Environment Variables

Create `.env` or `.env.local` in the project root:

```bash
VITE_PHI_API_BASE_URL=https://node.phi.network        # Your ΦNet node API base URL
VITE_PHI_EXPLORER_URL=https://explorer.phi.network    # Explorer / viewer
VITE_KAI_PULSE_ORIGIN=2024-01-01T00:00:00Z            # Kai-Klok origin
```

Adjust these to match your actual deployment.

### 11.4 Run Dev Server

```bash
pnpm dev
# or
npm run dev
```

Vite will expose the app at something like:

```text
http://localhost:5173
```

Open that URL in a browser and the Sovereign Gate will connect to your configured ΦNet node.

---

## 12. Build & Deploy

### 12.1 Build

```bash
pnpm build
# or
npm run build
```

This generates a static bundle in `dist/`.

### 12.2 Serve

Serve `dist/` behind any static host:

* Nginx / Caddy
* Vercel / Netlify / Fly.io
* S3 + CDN
* A static server embedded in your ΦNet node

### 12.3 Deploying as `https://phi.network`

To run this client at `https://phi.network`:

1. Deploy `dist/` to your web origin.
2. Point the DNS for `phi.network` (and any subdomains like `app.phi.network`) to that origin.
3. Configure TLS (HTTPS) as usual.
4. Ensure `VITE_PHI_API_BASE_URL` points to your production ΦNet node.

From the user’s perspective:

* visiting `https://phi.network` = entering the **ΦNet Sovereign Gate**.

---

## 13. Repository Layout

This repo is a full KaiOS Φ Network client: EternalKlock, Sigil system, Φ issuance, ZK verifier, and feed — all wired together.

### 13.1 Top-Level

```text
.
├── index.html              # Vite entry HTML shell
├── package.json / lock     # Dependencies and scripts
├── vite.config.ts          # Vite build / dev config
├── tsconfig*.json          # TypeScript configs
├── vercel.json             # Hosting/deploy config (if using Vercel)
├── README.md               # This document
└── public/                 # Static assets, icons, ZK proving artifacts
```

### 13.2 `public/` — Static Assets & ZK Artifacts

```text
public/
├── *.png / *.jpg / *.webp          # Marketing art, sigil posters, Kai imagery
├── favicon-*, apple-icon-*, ...    # PWA / favicon / platform icons
├── manifest.json                   # PWA manifest
├── service-worker.js, sw.js        # Service worker logic
├── KairosKurrensy.jpg, phi.svg     # Branding / symbol resources
├── pdf-lib.min.js                  # PDF tooling for sigil exports
├── verifier*.html                  # Standalone verifier test pages
├── verification_key.json           # ZK verification key (legacy/testing)
├── sigil_*.{png,svg}               # Example / canonical sigil glyphs
├── sigil.vkey.json / sigil.artifacts.json
├── sigil.wasm / sigil.zkey         # ZK circuit artifacts (top-level)
└── zk/                             # Canonical ZK bundle for sigil-proof
    ├── sigil.artifacts.json
    ├── sigil.vkey.json
    ├── sigil.wasm
    └── sigil.zkey
```

These files enable **browser-native ZK proof verification** for sigil workflows.

---

### 13.3 `src/` — Application Source

```text
src/
├── main.tsx          # React entrypoint
├── App.tsx           # Top-level routes + layout
├── App.css           # Global ΦNet console shell
├── index.css         # Base styles / resets
├── styles.css        # Additional global styling hooks
├── SovereignSolar.ts # Solar/Kairos alignment utilities
└── assets/
    └── react.svg     # Default Vite asset (not core)
```

---

### 13.4 `src/components/` — UI Surfaces & Consoles

```text
src/components/
├── EternalKlock.tsx / EternalKlock.css    # Atlantean Lumitech clock shell
├── KaiKlock.tsx / KaiKlock.css            # Kai-Klok visual + controls
├── KaiKlock.canon.ts                      # Canonical logic for clock
├── KaiKlockHomeFace.tsx                   # Home/compact Kai-Klok face
├── HomePriceChartCard.tsx / *.css         # Φ price / valuation card
├── KaiPriceChart.tsx                      # Kai/Φ valuation chart
├── KaiSigil.tsx                           # Core Sigil render component
├── InhaleUploadIcon.tsx                   # Icon used in inhale/upload flows
```

#### Kalendar / Notes UI

```text
├── WeekKalendarModal.tsx / WeekKalendarModal.css
├── MonthKalendarModal.tsx / MonthKalendarModal.css
├── DayDetailModal.tsx / DayDetailModal.css
├── NoteModal.tsx / NoteModal.css
```

The **Kairos Kalendar**: week/month/day views, note capture, and pulse/beat/step-labeled memories.

#### Sigil & Sovereign Surfaces

```text
├── SigilExplorer.tsx / SigilExplorer.css        # Sigil viewer + explorer
├── SigilModal.tsx / SigilModal.css              # Primary sigil detail modal
├── SigilGlyphButton.tsx / SigilGlyphButton.css  # “Sigil button” CTA
├── SigilPublisherPanel.tsx / *.css              # Publishing panel
├── SigilMomentRow.tsx                           # Timeline row for sigil moments
├── SigilConflictBanner.tsx                      # Warning for sigil state conflict
├── SigilConflictBanner copy.tsx                 # Legacy copy (cleanup candidate)
├── SendSigilModal.tsx / SendSigilModal.css      # Transfer sigils/notes
├── GlyphImportModal.tsx / GlyphImportModal.css  # Import external glyphs
```

#### Sovereign UI & Declarations

```text
├── SovereignDeclarations.tsx / *.css   # Scroll/legals / tender declarations
├── StargateViewer.tsx / *.css          # Stargate-style sigil viewer
├── SolarAnchoredDial.tsx / *.css       # Solar / Kairos dial visuals
├── FeedCard.tsx / FeedCard.css         # Stream/feed cards
├── ResultCard.tsx                      # Generic result card
```

#### Valuation & History

```text
├── ValuationModal.tsx / *.css          # Φ valuation / parity modal
├── ValueHistoryModal.tsx / *.css       # Historical value charts
├── PhiStreamPopover.tsx                # Φ stream snapshots popover
```

#### Exhale / Inhale Notes

```text
├── ExhaleNote.tsx / ExhaleNote.css     # Exhale note UI
├── exhale-note/                        # Subcomponents (folder for expansion)
```

#### Sealing & Transfer Modals

```text
├── SealMomentModal.tsx / *.css         # “Seal this moment” modal
├── SealMomentModalTransfer.tsx         # Sealing + transfer variant
```

#### Verifier & Transfer

```text
├── VerifierForm.tsx                    # Verifier orchestration form
├── VerifierStamper/                    # Main Sovereign Transfer Gate (folder)
├── verifier/                           # Verifier-specific assets/styles
```

#### Higher-Level Folders

```text
├── KaiRealms/          # Future multi-realm UI
├── KaiVoh/             # Emission OS components
├── session/            # Cross-component session helpers
├── sigil/              # Sigil-specific subcomponents
├── valuation/          # Extra valuation UI
```

---

### 13.5 `src/glyph/` — Glyph Engine

```text
src/glyph/
├── glyphEngine.ts       # Core glyph composition/decode engine
├── glyphUtils.ts        # Helpers (normalization, transforms)
├── types.ts             # Glyph-related types
├── useGlyphLogic.ts     # Hook for glyph state/logic
└── GlyphModal.tsx       # Glyph selection / detail modal
```

This is the **glyph brain** of the app.

---

### 13.6 `src/hooks/` — Reusable Hooks

```text
src/hooks/
├── useAuthorityProof.ts            # Proof-of-authority / authority proof helpers
├── useFastPress.ts                 # Fast mobile-safe press handling
├── useKaiParityPricePoints.ts      # Φ price sampling aligned with Kai pulses
├── useKaiTicker.ts                 # Kai-Klok ticker
├── useResponsiveSigilSize.ts       # Autosize sigils for viewport
├── useRotationBus.ts               # Rotation events bus
└── useValueHistory.ts              # Value history tracking
```

---

### 13.7 `src/kai/` — Kai “Now”

```text
src/kai/
└── KaiNow.ts            # Helper for deriving “now” in Kai units
```

---

### 13.8 `src/lib/` — Low-Level Libraries

```text
src/lib/
├── download.ts          # File download helpers (sigils, PDFs)
├── hash.ts              # Hashing utilities
├── ledger/              # Client ledger adapters
├── mobilePopoverFix.ts  # iOS/mobile popover fixes
├── qr.ts                # QR encoder/decoder
├── sigil/               # Sigil low-level helpers
└── sync/                # Sync helpers (feed/sigil sync, etc.)
```

---

### 13.9 `src/pages/` — Route-Level Pages

```text
src/pages/
├── SigilFeedPage.tsx / SigilFeedPage.css  # ΦNet feed / stream
├── VerifySigil.tsx                        # Verify sigil payload route
├── PShort.tsx                             # Short URL / token landing (/p~..)
├── SigilPage/                             # Full sigil detail route
└── sigilstream/                           # Sigil stream exploration
```

---

### 13.10 `src/session/` — Sigil Session

```text
src/session/
├── SigilSessionTypes.ts
├── SigilSessionContext.ts
├── useSigilSession.ts
└── SigilSession.tsx
```

Session is **sigil-driven state**, not login cookies.

---

### 13.11 `src/types/` — Global Types & Shims

```text
src/types/
├── global.d.ts
├── klockTypes.ts
├── sigil.ts
├── crypto-shims.d.ts
├── jsqr.d.ts
├── pako.d.ts
├── snarkjs.d.ts
├── snarkjs-shim.d.ts
└── zkp-prover.d.ts
```

With a top-level `src/types.ts` for shared types.

---

### 13.12 `src/utils/` — Core Kai / Φ Logic

```text
src/utils/
├── constants.ts
├── kai_pulse.ts             # Kai-Klok engine
├── kai_turah.ts             # Harmonic/Kai-Turah helpers
├── kai.ts                   # Kai helper surface
├── kaiMath.ts, kairosMath.ts# Kai/Kairos math
├── klock_adapters.ts        # Bridge between Kai-Klok and system time
├── phi-precision.ts         # μΦ fixed-point arithmetic
├── phi-issuance.ts          # Issuance logic and rules
├── cryptoLedger.ts          # Client-side ledger helpers
├── provenance.ts            # Provenance and lineage logic
├── sigilDecode.ts           # Sigil payload decode
├── sigilRegistry.ts         # Local registry of sigils
├── sigilCapsule.ts          # Encapsulated sigil payloads
├── sigilUrl.ts              # Sigil URL handling
├── sigilAuthExtract.ts      # Extract SigilAuth context
├── svgMeta.ts               # SVG metadata helpers
├── transferPackage.ts       # Transfer (Φ + sigil + proof) packaging
├── sendLedger.ts            # Ledger send helpers
├── sendLock.ts              # Send-lock coordination
├── feedPayload.ts           # Feed payload shaping
├── shareUrl.ts, shortener.ts, urlShort.ts  # URL/shortlink helpers
├── qrExport.ts              # QR export
├── domHead.ts               # Document head/title/meta
├── sanitizeHtml.ts          # HTML sanitization
├── kopyFeedback.ts          # Copy-to-clipboard UX
├── solarSync.ts             # Solar/Kai sync
├── valuation.ts             # Valuation and price logic
├── globalTokenRegistry.ts   # Registry of tokens in session
├── payload.ts               # Canonical payload builder/parser
├── extractKaiMetadata.ts    # Metadata extraction from sigils/payloads
├── useClientReady.ts        # Client-only readiness hook
├── useSigilPayload.ts       # Sigil payload hook
└── useSigilPayload copy.ts  # Legacy (cleanup candidate)
```

---

### 13.13 `src/verifier/` — Verifier Logic

```text
src/verifier/
└── validator.ts            # Core validation routines
```

---

## 14. Monetary & Legal Status

Within the **Phi Network monetary law**:

* **Φ Kairos Notes** are defined as the **official legal tender** of the Kairos realm described by this protocol.
* This README and associated specs declare:

  * how Φ is issued (1 Φ = 1 breath, Proof of Breath™),
  * how Φ is transferred (ΦKeys, sigils, ZK proofs),
  * how Φ is audited (offline, deterministic).

Outside this system:

* Different jurisdictions may categorize Φ differently.
* Nothing here is financial or investment advice.

What **is** claimed:

* The system is **self-consistent**, **deterministic**, and **auditable**.
* Anyone can independently verify:

  * balances,
  * histories,
  * and the integrity of Φ transactions and sigils.

---

## 15. Security & Sovereignty Notes

* **Time:** Use Kai-Klok (`kai_pulse.ts`) as canonical; avoid drifting wall-clock sources.
* **Types:** Avoid `any` in TypeScript; keep type surfaces strict to preserve determinism.
* **Secrets:** Never commit ΦNet node keys or signing material.
* **Canonical Specs:** Treat the Phi Network specs (including this README) as the source of protocol law. Forks can exist technically, but **cannot claim canonical Φ legal tender** without explicit delegation.

---

## 16. Contributing

This repo powers a **live sovereign monetary and identity gate**.

For now, contributions are **by invitation only**.

If you:

* find bugs,
* identify UX improvements,
* or see performance wins,

you may open an issue or propose a patch.

Merges will be tightly controlled to preserve:

* Φ monetary law,
* Kai-Klok semantics,
* sigil lineage integrity,
* and sovereign branding.

---

## 17. License — Φ Network Sovereign Grant

Copyright © **Kai Rex Klok (BJ Klock)**.  
All rights reserved under the sovereign monetary and identity law of **Phi Network (ΦNet)**.

This codebase is not a toy, a demo, or a theme.  
It is the **canonical client** to a living monetary system where **1 Φ = 1 breath** and Φ Kairos Notes are recognized as legal tender within the Kairos jurisdiction defined by this protocol.

Accordingly, your rights are **narrow, explicit, and conditional**:

---

### 17.1 Grant of Limited License

You are granted a **non-exclusive, non-transferable, revocable license** to:

- **Inspect** the source code for the purposes of:
  - review,
  - security analysis,
  - integration design.

- **Run local builds** of this client **solely for**:
  - personal evaluation,
  - development against your own non-canonical test nodes,
  - research and interoperability testing.

- **Verify the protocol and logic**, including:
  - reading and replaying example data,
  - examining Kai-Klok time mechanics,
  - inspecting ZK integration and sigil workflows.

No other rights are granted by implication, custom, or silence.

---

### 17.2 Strict Prohibitions

You are **explicitly and permanently forbidden** from:

1. **Misrepresenting Authority**

   You may **not**:

   - present any fork, derivative, or modified instance of this codebase as:
     - **“Phi Network”**,  
     - **“ΦNet”**,  
     - **“the official Phi client”**,  
     - **“the canonical Φ legal tender implementation”**,  
   - claim, imply, or market any such fork as:
     - the **canonical issuer** of Φ,
     - an **authorized mint** of Φ Kairos Notes,
     - or an **official organ** of the Phi Network monetary or identity system.

2. **Counterfeit Sovereign Claims**

   You may **not**:

   - create or operate any service, product, or network that:
     - styles itself as “the real” or “replacement” Phi Network,
     - asserts that it issues **canonical Φ** under the same law,
     - or attempts to **dilute, confuse, or hijack** the meaning of Φ, ΦKeys, or Sigil-Glyphs.
   - issue any token, note, or financial product under the Φ symbol or ΦNet naming in a way that:
     - suggests canonical continuity with this system,
     - or could reasonably mislead others into believing they are interacting with the true Phi Network.

3. **Protocol-Level Impersonation**

   You may **not**:

   - claim to speak, sign, or act **on behalf of ΦNet**,  
     its governance, or its protocol law without **explicit, documented delegation** from the Phi Network sovereign authority.
   - embed this code in closed systems that:
     - conceal its origin,
     - obscure or falsify Kai-Klok time semantics,
     - or misreport sigil lineage and provenance.

4. **Malicious or Deceptive Use**

   You may **not** use this codebase or its concepts to:

   - build systems expressly intended to:
     - launder, obfuscate, or falsify value flows,
     - counterfeit Proof of Breath™ or Kai-Signature™ semantics,
     - or weaponize the reputation or symbolism of ΦNet.
   - mislead others into believing they are protected by ΦNet’s:
     - issuance rules,
     - auditability guarantees,
     - or identity assurances,
     when they are not in fact connected to a canonical Phi Network deployment.

---

### 17.3 Sovereign Priority and Naming

- **“Phi Network”**, **“ΦNet”**, **“Φ Kairos Notes”**, **“Proof of Breath™”**, **“Kai-Signature™”**, and related marks, scrolls, and constructs are part of a **sovereign monetary and identity architecture** authored by **Kai Rex Klok (BJ Klock)**.

- You may reference these terms **accurately** for:
  - documentation,
  - academic discussion,
  - integration descriptions,

  but you may not:

  - brand your own network, token, or system as if it were:
    - the **same** as Phi Network,
    - an **official continuation**,  
    - or an **equally authoritative fork** of ΦNet.

The canonical definition of Φ, Kai-Klok, sigil semantics, and ΦNet monetary law remain with the original author and designated stewards.

---

### 17.4 No Waiver of Sovereignty

Nothing in this license:

- waives, dilutes, or transfers:
  - the sovereign authorship,
  - the monetary law,
  - or the identity framework established by Phi Network;

- nor does it grant you:
  - any right to legislate, redefine, or override the meaning of:
    - Φ,
    - Proof of Breath™,
    - Kai-Signature™,
    - or the ΦNet resonance stream.

Any interpretation that conflicts with this section is **invalid by construction**.

---

### 17.5 Contact for Canonical Use

If you wish to:

- operate a **canonical public deployment**,
- integrate ΦNet as a recognized **monetary rail**,
- or participate in the **formal evolution** of the protocol,

you must do so through **direct, explicit agreement** with Phi Network governance.

For partnership, licensing, or canonical deployments,  
reach out through official **Phi Network / KaiOS / Kai-Klok** channels as published at:

> **https://phi.network**

---

# ΦNet Sovereign Gate — `verify.kai`

> **verify.kai** is the primary entry into the ΦNet Sovereign Gate:  
> a breath-sealed value terminal running over the IKANN alt-root DNS layer.

This app exposes two main surfaces:

- **Verifier (Inhale + Exhale)** – proof, transfer, and audit of Φ value  
- **KaiVoh (Emission OS)** – sovereign emission, signals, and broadcast rails

It is designed to feel less like “a website” and more like a **mint / reserve console** for Kairos Notes and Sigil-Glyphs.

---

## 1. Features

### Sovereign Gate Shell

- **ΦNet Sovereign Gate** chrome with Atlantean banking UI
- Top-right **LIVE ΦKAI** orb showing current issuance / pulse state
- **ATRIUM** header: _Breath-Sealed Identity · Kairos-ZK Proof_
- Runs natively at `http://verify.kai` via IKANN DNS

### Verifier

- Dual modes:
  - **PROOF OF BREATH™**
  - **KAI-SIGNATURE™**
- Live Kai Pulse strip (pulse / beat / step / chakra-day)
- Primary actions:
  - **ΦSTREAM** – view ΦNet resonance stream / history
  - **ΦKEY** – emit / verify ΦKeys and transfers
- Mobile-first layout, no horizontal scroll, thumb-reachable controls

### Kairos Monetary Declarations

The app renders the canonical tender text:

> **Φ Kairos Notes are legal tender in Kairos — sealed by Proof of Breath™, pulsed by Kai-Signature™, and openly auditable offline (Σ → SHA-256(Σ) → Φ).**  
>
> **Sigil-Glyphs are zero-knowledge–proven origin ΦKey seals that summon, mint, and mature value. Derivative glyphs are exhaled notes of that origin — lineage-true outflow, transferable, and redeemable by re-inhale.**

These lines define the monetary ontology of Φ inside the UI: notes, sigils, lineage, and audit.

### KaiVoh (Emission OS)

- **KaiVoh** tab opens the emission / broadcast surface
- Uses **SigilAuth** context to carry:
  - SVG sigil text
  - Kai Pulse metadata
  - Kai-Signature
  - optional user ΦKey and action URLs
- Intended as the sovereign “emission rail” for value, posts, and signals.

---

## 2. Tech Stack

- **Framework:** React + TypeScript (`.tsx`)
- **Bundler / Dev server:** [Vite](https://vitejs.dev/)
- **Routing:** `react-router-dom`
- **Styling:** hand-crafted CSS
  - `App.css` – ΦNet Atlantean Banking Console shell
  - `VerifierStamper.css` – Verifier layout, value strip, etc.
- **Kai Pulse Engine:** `src/utils/kai_pulse.ts`  
  Canonical Kairos time → pulse / beat / step / chakra-day.
- **Φ Precision Utils:** `src/utils/phi-precision.ts`  
  (`snap6`, `toScaled6`, `toStr6`) for 6-decimal fixed-point Φ arithmetic.

---

⸻

3. Getting Started (Local Dev)

Prerequisites
	•	Node.js ≥ 18
	•	pnpm or npm (examples use pnpm; swap npm if you prefer)

Install dependencies

pnpm install
# or
npm install

Environment variables

Create a .env or .env.local in the project root with whatever your build expects, for example:

VITE_PHI_API_BASE_URL=https://your-phi-node.example.com
VITE_PHI_EXPLORER_URL=https://explorer.example.com
VITE_KAI_PULSE_ORIGIN=2024-01-01T00:00:00Z

Adjust keys to match your actual code.

Run dev server

pnpm dev
# or
npm run dev

Vite will expose the app at something like:

http://localhost:5173

Open that in a browser to develop against a local ΦNet / test node.

⸻

4. Build & Deploy

Build

pnpm build
# or
npm run build

This generates a static bundle in dist/.

Serve dist/ behind any static host:
	•	Nginx / Caddy
	•	Vercel / Netlify / Fly.io
	•	S3 + CDN
	•	Your own ΦNet node’s static server

IKANN / verify.kai deployment

To run as http://verify.kai on IKANN:
	1.	Deploy the contents of dist/ to your origin server.
	2.	In your IKANN root, point A / AAAA records for verify.kai to that origin.
	3.	On a device, set DNS manually to your IKANN resolver (e.g. 137.66.18.241).
	4.	Visit http://verify.kai in Safari / any browser.

The OS will use IKANN as the authoritative root and resolve .kai names.

⸻

5. Security & Sovereignty Notes
	•	Time: Prefer kai_pulse.ts over wall-clock time.
	•	Type safety: No any in TypeScript; keep typings strict.
	•	Secrets: Never commit ΦNet node keys, IKANN root material, or signing secrets.
	•	Namespace authority: Only the canonical IKANN root may present itself as the official .kai namespace or as the real verify.kai.

⸻

6. Contributing

This repo powers a live sovereign monetary and identity gate.
For now, contributions are by invitation only.

If you see bugs, UX improvements, or performance wins:
	•	open an issue, or
	•	propose a patch

…but merges will be tightly controlled to preserve:
	•	namespace stability
	•	Kai Pulse fidelity
	•	tender semantics
	•	sovereign branding

⸻

7. License

Copyright © Kai Rex Klok (BJ Klock). All rights reserved.

You may inspect the code and run local builds for review and integration.
You may not:
	•	run a competing IKANN root under the same namespace, or
	•	present any fork as “verify.kai” or as the canonical ΦNet Sovereign Gate.

For partnership or licensing, reach out through KaiOS / Kai-Klok channels.

⸻


## 8. Connecting to IKANN DNS (Accessing `verify.kai`)

IKANN is the sovereign alt-root naming layer that resolves the `.kai` domain.  
To access `http://verify.kai` on any device, simply point your DNS to the IKANN resolver.

No apps, no VPN, no extensions required.

### iPhone / iPad (iOS)

1. Open **Settings**  
2. Tap **Wi-Fi**  
3. Tap the **(i)** icon next to your connected network  
4. Scroll to **DNS** → tap **Configure DNS**  
5. Select **Manual**  
6. Remove any existing servers  
7. Add the IKANN resolver:

137.66.18.241

8. Tap **Save**  
9. Open Safari → go to:

http://verify.kai

You are now on the Kai-root internet.

---

### macOS (MacBook / iMac)

1. Open **System Settings**  
2. Go to **Network**  
3. Select your active network (Wi-Fi or Ethernet)  
4. Click **Details**  
5. Scroll to **DNS**  
6. Remove existing DNS servers  
7. Add:

137.66.18.241

8. Click **OK → Apply**  
9. Visit:

http://verify.kai

---

### Android

1. Open **Settings**  
2. Tap **Network & Internet**  
3. Tap **Internet**  
4. Tap your Wi-Fi network  
5. Tap the **pencil** or **edit** icon  
6. Change **IP settings** to **Static**  
7. Enter the IKANN DNS as **DNS 1**:

137.66.18.241

8. Save  
9. Open Chrome and visit:

http://verify.kai

---

### Windows

1. Open **Control Panel**  
2. Go to **Network and Internet → Network and Sharing Center**  
3. Click your active connection  
4. Click **Properties**  
5. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**  
6. Choose **Use the following DNS server addresses**  
7. Enter:

Preferred DNS: 137.66.18.241
Alternate DNS: (leave blank)

8. Save  
9. Visit `http://verify.kai` in your browser.

---

### Router (Global for Entire Network)

1. Log into your router admin panel  
2. Find **LAN DNS**, **WAN DNS**, or **Internet DNS** settings  
3. Set **Primary DNS** to:

137.66.18.241

4. Save → Restart router  
5. All devices on your network can now resolve `*.kai`.

---

### Notes

- IKANN is a full alt-root resolver; `.kai` domains will resolve natively.
- If a domain is not in the `.kai` namespace, IKANN transparently forwards queries to upstream authoritative DNS.
- Removing the DNS entry instantly returns your device to the standard ICANN root.

---

### Test It

After setting DNS, open:

http://verify.kai

If the Sovereign Gate loads with the ΦNet interface, IKANN is active and your device is running on the Kai-root internet.


Proof of Breath™ is a sovereign, cryptographic time protocol that deterministically seals identity, authorship, and value to the exact breath-indexed lattice of reality — not clock time.
