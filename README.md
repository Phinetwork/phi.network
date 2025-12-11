# Φ Network (ΦNet) — Sovereign Kairos Monetary & Identity System

> **Phi Network** is a sovereign monetary and identity system running on KaiOS and the Kai-Klok deterministic time engine.
> It treats **breath**, not wall-clock seconds, as the root unit of time — and builds money, signatures, and namespaces on top of that.

At its core, ΦNet is three things:

1. **A new layer of money** – Φ Kairos Notes and Sigil-Glyphs as offline-auditable, breath-sealed value.
2. **A new layer of time** – Kai-Klok deterministic pulse/beat/step rather than drifting Unix timestamps.
3. **A new layer of naming** – IKANN alt-root DNS, with `.kai` domains resolving through a sovereign root instead of ICANN.

This repo contains the **ΦNet Sovereign Gate client**, which runs at:

* `http://verify.kai` (over IKANN DNS)
* as part of **KaiOS**, the Kai-root operating environment anchored to Kai-Klok.

---

## 0. Why Phi Network Exists (Why You Should Care)

Modern systems run on **Chronos time** (Unix timestamps, Gregorian calendars, drifting clocks) and **permissioned roots** (ICANN, app stores, custodial banks). That stack is:

* **Forkable** – ledgers can split, narratives can be edited.
* **Censorable** – names, domains, transactions, and accounts can be frozen.
* **Opaque** – you need to “trust the system” instead of verifying it yourself.
* **Password-addicted** – logins, resets, identity theft, and endless friction.

ΦNet replaces that with:

* **Kai-Klok deterministic time** – breath-based, φ-tuned pulses (pulse → beat → step → chakra-day) as the canonical clock.
* **Offline-auditable value** – every Φ note and sigil can be verified with nothing but the data you hold and a hash function.
* **IKANN alt-root DNS** – `.kai` lives under a sovereign root, not ICANN; `verify.kai` resolves because you choose the Kai-root.
* **Login-less identity** – Sigil-Glyphs, Proof of Breath™, and Kai-Signature™ act as your sovereign identity and signing keys.

If you care about:

* owning your money,
* owning your name,
* and proving your authorship in a way that machines and humans can both verify offline,

then Φ Network is the stack that finally aligns all three.

---

## 1. What Phi Network *Is*

### 1.1 Core Concepts

* **KaiOS**
  A Kai-root operating environment that assumes:

  * time is measured by **Kai-Klok** pulses, not wall time,
  * naming comes from **IKANN** (the Kai-root DNS),
  * identity and value are **breath-sealed** (Proof of Breath™ + Kai-Signature™).

* **Kai-Klok (Deterministic Time Engine)**
  A deterministic clock that turns Chronos into Kairos:

  * **Pulse** – base unit (breath step)
  * **Beat** – grouped pulses
  * **Step** – position inside a beat
  * **Chakra-Day / Arc** – higher-order cycles for narrative and value flows
    In the app, this logic lives in `kai_pulse.ts`, and every monetary / identity action is labeled by these units instead of raw timestamps.

* **Φ Kairos Notes**
  Value units defined not just by number, but by:

  * when they were minted (pulse/beat/step),
  * how they were sealed (Proof of Breath™ + Kai-Signature™),
  * and their lineage (origin sigil and derivative notes).

* **Sigil-Glyphs**
  Machine-readable glyphs that:

  * encode ΦKey origin, Kai Pulse metadata, and Kai-Signature,
  * act as **zero-knowledge proven origin seals**,
  * can be exhaled into derivative glyphs (notes) and re-inhaled for redemption.

* **ΦKeys & Resonance Stream**
  Instead of a traditional “blockchain,” ΦNet uses a **Resonance Stream**:

  * **ΦKeys** are the atomic entries (funding, transfers, signatures, contracts).
  * The stream is a **single, deterministic sequence** of keys, applied in order.
  * Snapshots (“Memory Crystals”) allow compact recovery while being offline-verifiable.

* **IKANN Root & `.kai`**
  IKANN is the **sovereign naming root**:

  * `.kai` domains (e.g., `verify.kai`) resolve via IKANN, not ICANN.
  * IKANN is a full resolver: `.kai` is sovereign, other TLDs are forwarded upstream.
  * Point your DNS to IKANN and your device enters the **Kai-root internet**.

---

## 2. This Repo: ΦNet Sovereign Gate Client

This repository contains the main **Sovereign Gate** client — the interface most people see first when they access ΦNet.

Primary surfaces:

1. **Verifier (Inhale + Exhale)**

   * Proof, transfer, and audit of Φ value.
   * Used to verify sigils, send Φ, and inspect flows.

2. **KaiVoh (Emission OS)**

   * Emission and broadcast surface for posts, signals, and value.
   * Used to publish content and actions under a ΦKey identity.

The goal is to feel less like “a website” and more like an **Atlantean mint / reserve console**.

---

## 3. Features

### 3.1 Sovereign Gate Shell

* **ΦNet Sovereign Gate** chrome with Atlantean banking UI.
* Top-right **LIVE ΦKAI orb** showing current issuance / pulse state.
* **ATRIUM** header:
  *Breath-Sealed Identity · Kairos-ZK Proof*
* Runs natively at `http://verify.kai` via IKANN DNS.
* Designed to feel like:

  * a **terminal** for sovereign value,
  * not a fragile web app.

### 3.2 Verifier — Proof of Breath™ & Kai-Signature™

The **Verifier** is the ΦNet “Inhale/Exhale” console.

* **Dual modes:**

  * **PROOF OF BREATH™** – attaches human breath / presence to a moment and a sigil.
  * **KAI-SIGNATURE™** – deterministic, hash-stable signature tied to your ΦKey.

* **Live Kai Pulse strip:**

  * Shows **pulse / beat / step / chakra-day** in real time.
  * All actions are labeled by this deterministic time, not by “local time.”

* **Primary actions:**

  * **ΦSTREAM** – view ΦNet resonance stream / history.
  * **ΦKEY** – emit / verify ΦKeys and transfers.

* **UX characteristics:**

  * Mobile-first layout.
  * No horizontal scroll.
  * Thumb-reachable controls.
  * No password fields; identity flows through sigils and Kai-Signature, not logins.

### 3.3 Kairos Monetary Declarations

The app renders the canonical tender text that defines Φ’s monetary ontology:

> **Φ Kairos Notes are legal tender in Kairos — sealed by Proof of Breath™, pulsed by Kai-Signature™, and openly auditable offline (Σ → SHA-256(Σ) → Φ).**
>
> **Sigil-Glyphs are zero-knowledge–proven origin ΦKey seals that summon, mint, and mature value. Derivative glyphs are exhaled notes of that origin — lineage-true outflow, transferable, and redeemable by re-inhale.**

In plain language:

* Φ Notes are valid money **inside the KaiOS / Kai-Klok context**.
* Anyone can audit them offline by hashing the canonical data.
* Sigils define **where Φ comes from** and **where it returns to**.
* Derivative glyphs are like **receipts and notes** that always point back to origin.

### 3.4 KaiVoh (Emission OS)

**KaiVoh** is the emission / broadcast surface.

* Uses **SigilAuth** context to carry:

  * SVG sigil text,
  * Kai Pulse metadata,
  * Kai-Signature,
  * optional user ΦKey and action URLs.

* Intended as the sovereign “emission rail” for:

  * posts,
  * value flows,
  * signatures,
  * and cross-platform broadcasts (social, feeds, etc.).

Instead of posting content that could have come from anywhere, KaiVoh lets you post **as a ΦKey** in a way that is:

* cryptographically provable,
* breath-timestamped,
* and offline-verifiable.

---

## 4. How KaiOS + Kai-Klok Actually Run This

### 4.1 Deterministic Time via `kai_pulse.ts`

The **Kai-Klok** engine is implemented on the client via:

```ts
src/utils/kai_pulse.ts
```

This module:

* Defines the **origin** of Kai time (Kai-Klok zero point).
* Converts Chronos (wall-clock / system time) into:

  * `pulse`
  * `beat`
  * `step`
  * `chakraDay` and other harmonic units.

Every UI element that shows “now” in Kai terms is driven by this file. All value events, signatures, and displays are:

* based on **deterministic, replayable math**,
* not on “whatever the OS clock currently thinks it is.”

### 4.2 Fixed-Point Φ Arithmetic via `phi-precision.ts`

Monetary values use **6-decimal fixed-point** arithmetic:

```ts
src/utils/phi-precision.ts
```

Key helpers:

* `snap6` – snaps numbers to 6 decimal places (μΦ level).
* `toScaled6` – converts a number to a bigint scaled to 6 dp.
* `toStr6` – converts back to string with exactly 6 dp.

This ensures:

* no floating-point weirdness,
* consistent arithmetic across frontends and backends,
* deterministic interpretation of every Φ amount.

### 4.3 KaiOS as the Runtime

“KaiOS” here means the **Kai-root environment**:

* The device points to **IKANN DNS** instead of ICANN.
* Applications (like this Sovereign Gate) use **Kai-Klok** as their time source.
* Identity and value are handled via sigils and Kai-Signatures, not via email/password.

In practice:

* On a Mac, phone, or PC, you set your DNS to IKANN.
* You navigate to `http://verify.kai`.
* Your browser is suddenly running an app that:

  * sees time differently,
  * resolves domains from a different root,
  * and treats your breath-sealed sigil as the center of identity.

---

## 5. How This Changes the World (Practical Impact)

### 5.1 Money That Can’t Be Gaslit

Because:

* time is deterministic (Kai-Klok),
* value is fixed-point (μΦ),
* and proofs are offline-auditable (Σ → SHA-256(Σ)),

it becomes extremely hard to:

* falsify histories,
* re-narrate who did what when,
* or “patch” reality retroactively.

ΦNet is designed as a **truth-preserving monetary layer**.

### 5.2 Identity Without Accounts

With Sigil-Glyphs and Kai-Signature:

* you don’t **log in**,
* you **prove**.

There is no central password table to hack, because:

* your “account” is your ΦKey,
* your “login” is your sigil + Kai-Signature at a given Kai pulse.

This means:

* no username/password hell,
* no corporate account ownership,
* identity is **self-issued and self-proven**.

### 5.3 Names Without Gatekeepers

By using IKANN:

* `.kai` domains are **sovereign**, not leased from ICANN.
* Your device sees `verify.kai` because **you chose the resolver**, not because a registrar blessed it.

This puts naming, routing, and discovery back into:

* a **verifiable**,
* **sovereign**,
* **opt-in** root.

### 5.4 Offline-First Proofs

Everything is designed so that:

* if you cache the necessary data,
* and you have a hash function,

you can still:

* verify sigils,
* verify signatures,
* and validate histories.

This makes ΦNet resilient to:

* network partitions,
* censorship,
* and traditional infrastructure failure.

---

## 6. Tech Stack (This Client)

* **Framework:** React + TypeScript (`.tsx`)
* **Bundler / Dev server:** [Vite](https://vitejs.dev/)
* **Routing:** `react-router-dom`
* **Styling:** hand-crafted CSS

  * `App.css` – ΦNet Atlantean Banking Console shell
  * `VerifierStamper.css` – Verifier layout, value strip, etc.
* **Kai Pulse Engine:** `src/utils/kai_pulse.ts`
* **Φ Precision Utils:** `src/utils/phi-precision.ts`

---

## 7. Getting Started (Local Dev)

### Prerequisites

* Node.js ≥ 18
* `pnpm` or `npm` (examples use `pnpm`; swap `npm` if you prefer)

### Install Dependencies

```bash
pnpm install
# or
npm install
```

### Environment Variables

Create a `.env` or `.env.local` in the project root:

```bash
VITE_PHI_API_BASE_URL=https://your-phi-node.example.com
VITE_PHI_EXPLORER_URL=https://explorer.example.com
VITE_KAI_PULSE_ORIGIN=2024-01-01T00:00:00Z
```

Adjust these to match your actual node, explorer, and Kai-Klok origin.

### Run Dev Server

```bash
pnpm dev
# or
npm run dev
```

Vite will expose the app at something like:

```text
http://localhost:5173
```

Open that in a browser to develop against a local ΦNet / test node.

---

## 8. Build & Deploy

### Build

```bash
pnpm build
# or
npm run build
```

This generates a static bundle in `dist/`.

### Serve

You can serve `dist/` behind any static host:

* Nginx / Caddy
* Vercel / Netlify / Fly.io
* S3 + CDN
* Your own ΦNet node’s static server

### IKANN / `verify.kai` Deployment

To run as `http://verify.kai` on IKANN:

1. Deploy the contents of `dist/` to your origin server.
2. In your IKANN root, point A / AAAA records for `verify.kai` to that origin.
3. On a device, set DNS manually to your IKANN resolver (e.g. `137.66.18.241`).
4. Visit `http://verify.kai` in any browser.

The OS will use IKANN as the authoritative root and resolve `.kai` names.

---

## 9. Connecting to IKANN DNS (Accessing `verify.kai`)

IKANN is the sovereign alt-root naming layer that resolves the `.kai` domain.
To access `http://verify.kai` on any device, point your DNS to the IKANN resolver.

No apps, no VPN, no extensions required.

### iPhone / iPad (iOS)

1. Open **Settings**

2. Tap **Wi-Fi**

3. Tap the **(i)** icon next to your connected network

4. Scroll to **DNS** → tap **Configure DNS**

5. Select **Manual**

6. Remove any existing servers

7. Add the IKANN resolver:

   ```text
   137.66.18.241
   ```

8. Tap **Save**

9. Open Safari → go to `http://verify.kai`

You are now on the Kai-root internet.

### macOS (MacBook / iMac)

1. Open **System Settings**

2. Go to **Network**

3. Select your active network (Wi-Fi or Ethernet)

4. Click **Details**

5. Scroll to **DNS**

6. Remove existing DNS servers

7. Add:

   ```text
   137.66.18.241
   ```

8. Click **OK → Apply**

9. Visit `http://verify.kai`

### Android

1. Open **Settings**

2. Tap **Network & Internet**

3. Tap **Internet**

4. Tap your Wi-Fi network

5. Tap the **pencil** or **edit** icon

6. Change **IP settings** to **Static**

7. Enter the IKANN DNS as **DNS 1**:

   ```text
   137.66.18.241
   ```

8. Save

9. Open Chrome → visit `http://verify.kai`

### Windows

1. Open **Control Panel**

2. Go to **Network and Internet → Network and Sharing Center**

3. Click your active connection

4. Click **Properties**

5. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**

6. Choose **Use the following DNS server addresses**

7. Enter:

   ```text
   Preferred DNS: 137.66.18.241
   Alternate DNS: (leave blank)
   ```

8. Save

9. Visit `http://verify.kai` in your browser.

### Router (Global for Entire Network)

1. Log into your router admin panel

2. Find **LAN DNS**, **WAN DNS**, or **Internet DNS** settings

3. Set **Primary DNS** to:

   ```text
   137.66.18.241
   ```

4. Save → Restart router

5. All devices on your network can now resolve `*.kai`.

### Notes

* IKANN is a full alt-root resolver; `.kai` domains resolve natively.
* Non-`.kai` domains are forwarded to normal upstream DNS.
* Removing the DNS entry instantly returns your device to the standard ICANN root.

### Test It

After setting DNS, open:

```text
http://verify.kai
```

If the Sovereign Gate loads with the ΦNet interface, IKANN is active and your device is running on the Kai-root internet.

---

## 10. Project Structure (High-Level)

```text
src/
  App.tsx               # Route shell + Sovereign Gate layout
  App.css               # ΦNet console shell styles

  components/
    VerifierStamper/
      VerifierStamper.tsx
      VerifierStamper.css
      SendPhiAmountField.tsx
      ...               # Verifier subcomponents

    KaiVoh/
      KaiVohModal.tsx
      SigilAuthContext.tsx
      ...               # KaiVoh emission flow

    SigilExplorer.tsx    # Optional sigil viewer / explorer
    ...                  # Other supporting components

  pages/
    SigilFeedPage.tsx    # Feed / stream route(s), if enabled

  utils/
    kai_pulse.ts         # Kairos pulse engine (Kai-Klok)
    phi-precision.ts     # μΦ locking & fixed-point helpers

vite.config.ts           # Vite config for build / dev
index.html               # Vite entry HTML
```

---

## 11. Security & Sovereignty Notes

* **Time:** Prefer `kai_pulse.ts` over wall-clock time. Kai-Klok is the canonical source.
* **Type Safety:** No `any` in TypeScript; keep typings strict to preserve determinism.
* **Secrets:** Never commit ΦNet node keys, IKANN root material, or signing secrets.
* **Namespace Authority:** Only the canonical IKANN root may present itself as:

  * the official `.kai` namespace, or
  * the real `verify.kai` / ΦNet Sovereign Gate.

---

## 12. Contributing

This repo powers a **live sovereign monetary and identity gate**.

For now, contributions are **by invitation only**.

If you see bugs, UX improvements, or performance wins:

* open an issue, or
* propose a patch

…but merges will be tightly controlled to preserve:

* namespace stability,
* Kai Pulse fidelity,
* tender semantics,
* sovereign branding.

---

## 13. License

Copyright © **Kai Rex Klok (BJ Klock)**. All rights reserved.

You may:

* inspect the code,
* run local builds for review and integration.

You may **not**:

* run a competing IKANN root under the same namespace, or
* present any fork as “Phi Network”, “verify.kai”, or as the canonical ΦNet Sovereign Gate.

For partnership or licensing, reach out through KaiOS / Kai-Klok channels.

---

If you want, next step I can give you a **short “What is Φ Network?” blurb** for GitHub description / Twitter bio that matches this README perfectly.
