// /components/KaiVoh/KaiVohApp.tsx
"use client";

/**
 * KaiVohApp — Kai-Sigil Posting OS
 * v5.0 — Sealed | Embedded | Broadcast | Verified (Kai-Klok aligned)
 *
 * Flow:
 *   1. Login   — Scan / upload Kai-Sigil, verify Kai Signature → derive Φ-Key.
 *   2. Connect — Configure KaiVoh (accounts, docs, attachments, stream tools).
 *   3. Compose — PostComposer: write post + choose media to be sealed.
 *   4. Seal    — Breath-based sealing (Kai pulse, chakra day, KKS v1).
 *   5. Embed   — Embed Kai Signature + Φ-Key metadata directly into media.
 *   6. Share   — Broadcast hub (MultiShareDispatcher + /api/post/*).
 *   7. Verify  — VerifierFrame (QR + proof) so anyone can confirm human origin.
 */

import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import "./styles/KaiVohApp.css";

/* UI flow */
import SigilLogin from "./SigilLogin";
import { SessionProvider, useSession } from "./SessionManager";
import KaiVoh from "./KaiVoh"; // KaiVoh = connect + stream tools
import PostComposer from "./PostComposer";
import type { ComposedPost } from "./PostComposer";
import BreathSealer from "./BreathSealer";
import type { SealedPost } from "./BreathSealer";
import { embedKaiSignature } from "./SignatureEmbedder";
import type { EmbeddedMediaResult } from "./SignatureEmbedder";
import MultiShareDispatcher from "./MultiShareDispatcher";
import { buildNextSigilSvg, downloadSigil } from "./SigilMemoryBuilder";
/* New: full verifier frame (QR + Φ-Key proof) */
import VerifierFrame from "./VerifierFrame";

/* Canonical crypto parity (match VerifierStamper): derive Φ-Key FROM SIGNATURE */
import { derivePhiKeyFromSig } from "../VerifierStamper/sigilUtils";

/* Kai-Klok φ-engine (KKS v1) */
import { fetchKaiOrLocal, epochMsFromPulse } from "../../utils/kai_pulse";

/* Types */
import type { PostEntry, SessionData } from "./SessionManager";

/* -------------------------------------------------------------------------- */
/*                               Helper Types                                 */
/* -------------------------------------------------------------------------- */

type FlowStep =
  | "login"
  | "connect"
  | "compose"
  | "seal"
  | "embed"
  | "share"
  | "verify";

/**
 * Minimal, trusted shape we accept from SigilLogin → never from data-* attrs.
 * Login already did the heavy crypto verification; here we just normalize.
 */
interface SigilMeta {
  kaiSignature: string;
  pulse: number;
  chakraDay?: string;
  userPhiKey?: string;
  connectedAccounts?: Record<string, string>;
  postLedger?: PostEntry[];
}

/** Shape of the embedded KKS metadata coming back from SignatureEmbedder */
type KaiSigKksMetadataShape = EmbeddedMediaResult["metadata"];

/**
 * Extended metadata we keep in-memory for the app.
 * Structurally compatible with KaiSigKksMetadata, but with a few extra
 * convenience fields for the KaiVoh experience.
 */
type ExtendedKksMetadata = KaiSigKksMetadataShape & {
  originPulse?: number;
  sigilPulse?: number;
  exhalePulse?: number;
};

/* -------------------------------------------------------------------------- */
/*                           Narrowing / Validation                            */
/* -------------------------------------------------------------------------- */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isPostEntry(v: unknown): v is PostEntry {
  return (
    isRecord(v) &&
    typeof v.pulse === "number" &&
    typeof v.platform === "string" &&
    typeof v.link === "string"
  );
}

function toPostLedger(v: unknown): PostEntry[] {
  if (!Array.isArray(v)) return [];
  const out: PostEntry[] = [];
  for (const item of v) {
    if (isPostEntry(item)) out.push(item);
  }
  return out;
}

function toStringRecord(
  v: unknown,
): Record<string, string> | undefined {
  if (!isRecord(v)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

function parseSigilMeta(v: unknown): SigilMeta | null {
  if (!isRecord(v)) return null;

  const kaiSignature = v.kaiSignature;
  const pulse = v.pulse;
  if (typeof kaiSignature !== "string" || typeof pulse !== "number") {
    return null;
  }

  const chakraDay =
    typeof v.chakraDay === "string" ? v.chakraDay : undefined;
  const userPhiKey =
    typeof v.userPhiKey === "string" ? v.userPhiKey : undefined;
  const connectedAccounts = toStringRecord(v.connectedAccounts);
  const postLedger = toPostLedger(v.postLedger);

  return {
    kaiSignature,
    pulse,
    chakraDay,
    userPhiKey,
    connectedAccounts,
    postLedger,
  };
}

/** Light, sane Base58 (no case-folding, no hard 34-char lock) */
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;
function isValidPhiKeyShape(k: string): boolean {
  return BASE58_RE.test(k) && k.length >= 26 && k.length <= 64;
}

/* -------------------------------------------------------------------------- */
/*                          Presentation Helpers                              */
/* -------------------------------------------------------------------------- */

const FLOW_ORDER: FlowStep[] = [
  "connect", // login is pre-flow; HUD appears after
  "compose",
  "seal",
  "embed",
  "share",
  "verify",
];

const FLOW_LABEL: Record<FlowStep, string> = {
  login: "Login",
  connect: "KaiVoh",
  compose: "Compose",
  seal: "Seal Breath",
  embed: "Embed Signature",
  share: "Share",
  verify: "Verify",
};

function shortKey(k: string | undefined): string {
  if (!k) return "—";
  if (k.length <= 10) return k;
  return `${k.slice(0, 5)}…${k.slice(-4)}`;
}

function chakraClass(chakraDay?: string): string {
  const base = (chakraDay || "Crown").toLowerCase();
  return `kv-chakra-${base}`;
}

function formatCountdown(ms?: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "0.0s";
  const seconds = ms / 1000;
  if (seconds < 1) return `${seconds.toFixed(2)}s`;
  if (seconds < 10) return `${seconds.toFixed(1)}s`;
  return `${seconds.toFixed(0)}s`;
}

/* --------------------------- UI Subcomponents ----------------------------- */

interface StepIndicatorProps {
  current: FlowStep;
}

function StepIndicator({ current }: StepIndicatorProps): ReactElement {
  const currentIndex = FLOW_ORDER.indexOf(current);

  return (
    <div className="kv-steps">
      {FLOW_ORDER.map((step, index) => {
        const isCurrent = step === current;
        const isDone = currentIndex >= 0 && index < currentIndex;

        const chipClass = [
          "kv-step-chip",
          isDone ? "kv-step-chip--done" : "",
          isCurrent ? "kv-step-chip--active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={step} className="kv-step">
            <div className={chipClass}>
              <span className="kv-step-index">{index + 1}</span>
              <span className="kv-step-label">{FLOW_LABEL[step]}</span>
            </div>
            {index < FLOW_ORDER.length - 1 && (
              <div className="kv-step-rail" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SessionHudProps {
  session: SessionData;
  step: FlowStep;
  hasConnectedAccounts: boolean;
  onLogout: () => void;
  onNewPost: () => void;
  livePulse?: number | null;
  msToNextPulse?: number | null;
}

function SessionHud({
  session,
  step,
  hasConnectedAccounts,
  onLogout,
  onNewPost,
  livePulse,
  msToNextPulse,
}: SessionHudProps): ReactElement {
  const ledgerCount = session.postLedger?.length ?? 0;
  const pulseDisplay = livePulse ?? session.pulse;
  const countdownLabel = formatCountdown(msToNextPulse);

  return (
    <header
      className={["kv-session-hud", chakraClass(session.chakraDay)].join(
        " ",
      )}
    >
      <div className="kv-session-main">
        <div className="kv-session-header-row">
          <div className="kv-session-title-block">
            <div className="kv-session-kicker">KaiVoh · Glyph Session</div>
            <div className="kv-session-keyline">
              <span className="kv-meta-item kv-meta-phikey">
                <span className="kv-meta-label">Φ-Key</span>
                <span className="kv-meta-value">
                  {shortKey(session.phiKey)}
                </span>
              </span>
              <span className="kv-meta-divider" />
              <span className="kv-meta-item">
                <span className="kv-meta-label">Sigil Pulse</span>
                <span className="kv-meta-value">{session.pulse}</span>
              </span>
              <span className="kv-meta-divider" />
              <span className="kv-meta-item">
                <span className="kv-meta-label">Chakra</span>
                <span className="kv-meta-value">
                  {session.chakraDay ?? "Crown"}
                </span>
              </span>
              {ledgerCount > 0 && (
                <>
                  <span className="kv-meta-divider" />
                  <span className="kv-meta-item kv-meta-activity">
                    <span className="kv-meta-label">Sealed</span>
                    <span className="kv-meta-value">
                      {ledgerCount}{" "}
                      {ledgerCount === 1 ? "post" : "posts"}
                    </span>
                  </span>
                </>
              )}
            </div>

            <div className="kv-session-live">
              <span className="kv-live-label">Live Kai Pulse</span>
              <span className="kv-live-value">
                {pulseDisplay}
                <span className="kv-live-countdown">
                  · next breath in {countdownLabel}
                </span>
              </span>
            </div>
          </div>

          <div className="kv-session-status-block">
            <span
              className={[
                "kv-accounts-pill",
                hasConnectedAccounts
                  ? "kv-accounts-pill--ok"
                  : "kv-accounts-pill--warn",
              ].join(" ")}
            >
              {hasConnectedAccounts
                ? "Accounts linked"
                : "Connect accounts"}
            </span>
            <span className="kv-step-current-label">
              {FLOW_LABEL[step] ?? "Flow"}
            </span>
          </div>
        </div>

        <div className="kv-session-steps-row">
          <StepIndicator current={step} />
        </div>
      </div>

      <div className="kv-session-actions">
        <button
          type="button"
          onClick={onNewPost}
          className="kv-btn kv-btn-primary"
        >
        + Exhale Memory
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="kv-btn kv-btn-ghost"
        >
          ⏻ Inhale Memories
        </button>
      </div>
    </header>
  );
}

interface ActivityStripProps {
  ledger: PostEntry[];
}

function ActivityStrip({ ledger }: ActivityStripProps): ReactElement | null {
  if (!ledger || ledger.length === 0) return null;
  const lastFew = [...ledger]
    .sort((a, b) => b.pulse - a.pulse)
    .slice(0, 4);

  return (
    <section className="kv-activity">
      <div className="kv-activity-header">
        <span className="kv-activity-title">Session Activity</span>
        <span className="kv-activity-count">{ledger.length} total</span>
      </div>
      <div className="kv-activity-list">
        {lastFew.map((entry) => (
          <div
            key={`${entry.platform}-${entry.pulse}-${entry.link}`}
            className="kv-activity-item"
          >
            <div className="kv-activity-item-main">
              <span className="kv-activity-platform">
                {entry.platform}
              </span>
              <span className="kv-activity-pulse">
                Pulse <span>{entry.pulse}</span>
              </span>
            </div>
            {entry.link && (
              <a
                href={entry.link}
                target="_blank"
                rel="noreferrer"
                className="kv-activity-link"
              >
                {entry.link}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Flow                                     */
/* -------------------------------------------------------------------------- */

function KaiVohFlow(): ReactElement {
  const { session, setSession, clearSession } = useSession();

  const [step, setStep] = useState<FlowStep>("login");
  const [post, setPost] = useState<ComposedPost | null>(null);
  const [sealed, setSealed] = useState<SealedPost | null>(null);
  const [finalMedia, setFinalMedia] =
    useState<EmbeddedMediaResult | null>(null);
  const [verifierData, setVerifierData] = useState<{
    pulse: number;
    kaiSignature: string;
    phiKey: string;
  } | null>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  /* Live Kai pulse + countdown (KKS v1) */
  const [livePulse, setLivePulse] = useState<number | null>(null);
  const [msToNextPulse, setMsToNextPulse] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const now = new Date();
      const kai = await fetchKaiOrLocal(undefined, now);
      if (cancelled) return;

      const pulseNow = kai.pulse;
      const nextPulseMsBI = epochMsFromPulse(pulseNow + 1);
      let remaining = Number(nextPulseMsBI - BigInt(now.getTime()));
      if (!Number.isFinite(remaining) || remaining < 0) remaining = 0;

      setLivePulse(pulseNow);
      setMsToNextPulse(remaining);
    };

    void tick();
    const timer = window.setInterval(() => {
      void tick();
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const hasConnectedAccounts = useMemo(
    () =>
      !!session &&
      !!session.connectedAccounts &&
      Object.keys(session.connectedAccounts).length > 0,
    [session],
  );

  /* ---------------------------------------------------------------------- */
  /*                          Session + Sigil Handling                      */
  /* ---------------------------------------------------------------------- */

  /** Top-of-funnel: receive verified meta from SigilLogin (already signature-checked there) */
  const handleSigilVerified = async (
    _svgText: string,
    rawMeta: unknown,
  ): Promise<void> => {
    try {
      setFlowError(null);

      const meta = parseSigilMeta(rawMeta);
      if (!meta) throw new Error("Malformed sigil metadata from login.");

      const expectedPhiKey = await derivePhiKeyFromSig(meta.kaiSignature);

      if (meta.userPhiKey && meta.userPhiKey !== expectedPhiKey) {
        console.warn(
          "[KaiVoh] Embedded userPhiKey differs from derived; preferring derived from signature.",
          { embedded: meta.userPhiKey, derived: expectedPhiKey },
        );
      }

      if (!isValidPhiKeyShape(expectedPhiKey)) {
        throw new Error("Invalid Φ-Key shape after derivation.");
      }

      const nextSession: SessionData = {
        phiKey: expectedPhiKey,
        kaiSignature: meta.kaiSignature,
        pulse: meta.pulse,
        chakraDay: meta.chakraDay ?? "Crown",
        connectedAccounts: meta.connectedAccounts ?? {},
        postLedger: meta.postLedger ?? [],
      };

      setSession(nextSession);

      if (
        nextSession.connectedAccounts &&
        Object.keys(nextSession.connectedAccounts).length > 0
      ) {
        setStep("compose");
      } else {
        setStep("connect");
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Invalid Φ-Key signature or metadata.";
      setFlowError(msg);
      setStep("login");
    }
  };

  /** Logout mints the next sigil and resets flow */
  const handleLogout = (): void => {
    if (!session) return;

    const nextSvg = buildNextSigilSvg(session);
    downloadSigil(`sigil-${session.pulse + 1}.svg`, nextSvg);

    clearSession();
    setPost(null);
    setSealed(null);
    setFinalMedia(null);
    setVerifierData(null);
    setFlowError(null);
    setStep("login");
  };

  /** Start a new post inside the same sigil (no logout) */
  const handleNewPost = (): void => {
    setPost(null);
    setSealed(null);
    setFinalMedia(null);
    setVerifierData(null);
    setFlowError(null);
    setStep("compose");
  };

  /* ---------------------------------------------------------------------- */
  /*                          Embedding Kai Signature                       */
  /* ---------------------------------------------------------------------- */

  /** Embed signature exactly once when we enter "embed" */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (step !== "embed" || !sealed || !session) return;

      try {
        const mediaRaw = await embedKaiSignature(sealed);
        if (cancelled) return;

        const originPulse = session.pulse;
        const exhalePulse = sealed.pulse;

        // memory_<originPulse>_<exhalePulse>.svg
        const filename = `memory_p${originPulse}_p${exhalePulse}.svg`;

        const baseMeta = (mediaRaw.metadata ??
          {}) as KaiSigKksMetadataShape;

        const mergedMetadata: ExtendedKksMetadata = {
          ...baseMeta,
          originPulse,
          sigilPulse: originPulse,
          exhalePulse,
          phiKey: session.phiKey,
        };

        const media: EmbeddedMediaResult = {
          ...mediaRaw,
          filename,
          metadata: mergedMetadata,
        };

        setFinalMedia(media);
        setVerifierData({
          pulse: sealed.pulse,
          kaiSignature: sealed.kaiSignature,
          phiKey: session.phiKey,
        });
        setStep("share");
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to embed Kai Signature into media.";
        setFlowError(msg);
        setStep("compose");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, sealed, session]);

  /* ---------------------------------------------------------------------- */
  /*                             Ledger Helpers                             */
  /* ---------------------------------------------------------------------- */

  /**
   * Append broadcast results into the in-session ledger so every share
   * is remembered as part of the sigil's living history.
   */
  const appendBroadcastToLedger = (
    results: { platform: string; link: string }[],
    pulse: number,
  ): void => {
    if (!session || results.length === 0) return;

    const existing = session.postLedger ?? [];
    const appended: PostEntry[] = [
      ...existing,
      ...results.map((r) => ({
        pulse,
        platform: r.platform,
        link: r.link,
      })),
    ];

    setSession({
      ...session,
      postLedger: appended,
    });
  };

  /* ---------------------------------------------------------------------- */
  /*                                Rendering                               */
  /* ---------------------------------------------------------------------- */

  if (!session || step === "login") {
    return (
      <div className="kai-voh-login-shell">
        <main className="kv-main-card">
          <SigilLogin onVerified={handleSigilVerified} />
          {flowError && <p className="kv-error">{flowError}</p>}
        </main>
      </div>
    );
  }

  const renderStep = (): ReactElement => {
    if (step === "connect") {
      return (
        <div className="kv-connect-step">
          <KaiVoh />
          <button
            type="button"
            onClick={() => setStep("compose")}
            className="kv-btn kv-btn-primary kv-btn-wide"
          >
            Continue to Compose
          </button>
        </div>
      );
    }

    if (step === "compose" && !post) {
      return (
        <PostComposer
          onReady={(p: ComposedPost) => {
            setPost(p);
            setSealed(null);
            setFinalMedia(null);
            setVerifierData(null);
            setFlowError(null);
            setStep("seal");
          }}
        />
      );
    }

    if (step === "seal" && post) {
      return (
        <BreathSealer
          post={post}
          onSealComplete={(sealedPost: SealedPost) => {
            setSealed(sealedPost);
            setStep("embed");
          }}
        />
      );
    }

    if (step === "embed") {
      return (
        <p className="kv-embed-status">
          Embedding Kai Signature into your media…
        </p>
      );
    }

    if (step === "share" && finalMedia && sealed && session) {
      return (
        <MultiShareDispatcher
          media={finalMedia}
          onComplete={(results) => {
            appendBroadcastToLedger(results, sealed.pulse);
            setStep("verify");
          }}
        />
      );
    }

    if (step === "verify" && verifierData && session) {
      return (
        <div className="kv-verify-step">
          <VerifierFrame
            pulse={verifierData.pulse}
            kaiSignature={verifierData.kaiSignature}
            phiKey={verifierData.phiKey}
            chakraDay={session.chakraDay}
            /* If you want, you can pass the post caption here once you
               confirm the field name on ComposedPost / SealedPost, e.g.:
               caption={post?.text ?? undefined}
            */
            compact={false}
          />
          <p className="kv-verify-copy">
            Your memory is now verifiable as human-authored under this Φ-Key.
            Anyone can scan the QR or open the verifier link to confirm it
            was sealed at this pulse under your sigil.
          </p>
          <div className="kv-verify-actions">
            <button
              type="button"
              onClick={handleNewPost}
              className="kv-btn kv-btn-primary"
            >
              + Exhale Memory
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="kv-btn kv-btn-ghost"
            >
              ⏻ Inhale Memories
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="kv-error-state">
        Something went sideways in the breath stream…
        <button
          type="button"
          onClick={handleNewPost}
          className="kv-error-reset"
        >
          Reset step
        </button>
      </div>
    );
  };

  return (
    <div className="kai-voh-app-shell">
      <SessionHud
        session={session}
        step={step}
        hasConnectedAccounts={hasConnectedAccounts}
        onLogout={handleLogout}
        onNewPost={handleNewPost}
        livePulse={livePulse}
        msToNextPulse={msToNextPulse}
      />

      <main className="kv-main-card">
        {renderStep()}
        {flowError && <p className="kv-error">{flowError}</p>}
      </main>

      {session.postLedger && session.postLedger.length > 0 && (
        <ActivityStrip ledger={session.postLedger} />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   App                                      */
/* -------------------------------------------------------------------------- */

export default function KaiVohApp(): ReactElement {
  return (
    <SessionProvider>
      <KaiVohFlow />
    </SessionProvider>
  );
}
