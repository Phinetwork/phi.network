// src/pages/VerifySigil.tsx
/* Kai Verifier — /verify/sigil
 * - Accepts ?p= payload (useSigilPayload) OR uploaded SVG
 * - Computes Breath Proof using verifierCanon
 * - Shows σ-string, σ-hash, derived Φ-key, and match status
 */

"use client";

import type * as React from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* Core visual */
import KaiSigil from "../components/KaiSigil";

/* Reuse the SigilPage shell styling (veil, viewport, shell, etc.) */
import "./SigilPage/SigilPage.css";

/* Kai math */
import {
  ETERNAL_STEPS_PER_BEAT as STEPS_PER_BEAT,
  stepIndexFromPulse,
  percentIntoStepFromPulse,
} from "../SovereignSolar";

/* Chakra theming (for subtle accent + info) */
import { CHAKRA_THEME } from "../components/sigil/theme";

/* Payload plumbing (?p= in URL) */
import { useSigilPayload } from "../utils/useSigilPayload";

/* SVG verification util */
import { validateSvgForVerifier } from "../utils/svgMeta";

/* Canonical verifier math */
import {
  sha256HexCanon,
  derivePhiKeyFromSigCanon,
  verifierSigmaString,
  readIntentionSigil,
} from "./SigilPage/verifierCanon";

/* Central Kai sigil payload type */
import type { SigilPayload } from "../types/sigil";

/* ──────────────────────────────────────────────────────────────
   Local types
   ───────────────────────────────────────────────────────────── */

type VerifyStatus = "checking" | "verified" | "mismatch" | "no-sigil";

type BreathProof = {
  pulse: number;
  beat: number;
  stepsPerBeat: number;
  stepIndex: number;
  chakraDay: string;
  intention: string | null;
  sigmaString: string;
  sigmaHash: string; // sha256HexCanon result
  derivedPhiKey: string;
  payloadKaiSignature?: string | null;
  payloadUserPhiKey?: string | null;
  matches: { sigma: boolean; phi: boolean };
};

type SourceKind = "none" | "query" | "upload";

/* ──────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */

export default function VerifySigil(): React.JSX.Element {
  // We don't rely on react-router; just read the browser's query string.
  const search =
    typeof window !== "undefined" ? window.location.search : "";

  // URL payload (e.g. /verify/sigil?p=...)
  const {
    payload: urlPayload,
    loading: urlLoading,
    setPayload: setUrlPayload,
    setLoading: setUrlLoading,
  } = useSigilPayload(search);
  // intentionally unused from this component, but kept for compatibility
  void setUrlPayload;
  void setUrlLoading;

  // Upload payload
  const [filePayload, setFilePayload] = useState<SigilPayload | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [breathProof, setBreathProof] = useState<BreathProof | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sigilSize, setSigilSize] = useState<number>(320);
  const frameRef = useRef<HTMLDivElement | null>(null);

  // Unified payload: upload overrides URL
  const payload: SigilPayload | null = useMemo(
    () => filePayload ?? (urlPayload as SigilPayload | null),
    [filePayload, urlPayload]
  );

  // Basic derived display values
  const chakraDay = (payload?.chakraDay ?? "Throat") as SigilPayload["chakraDay"];
  const steps: number = (payload?.stepsPerBeat ?? STEPS_PER_BEAT) as number;

  const stepIndex = useMemo(
    () => (payload ? stepIndexFromPulse(payload.pulse, steps) : 0),
    [payload, steps]
  );

  const stepPct = useMemo(
    () =>
      typeof payload?.stepPct === "number"
        ? Math.max(0, Math.min(1, payload.stepPct))
        : percentIntoStepFromPulse(payload?.pulse ?? 0),
    [payload]
  );

  // Align dependencies with React Compiler: depend on `payload` not `payload?.canonicalHash`
  const shortHash = useMemo(
    () =>
      payload?.canonicalHash ? payload.canonicalHash.slice(0, 16) : "—",
    [payload]
  );

  /* ──────────────────────────────────────────────────────────
     Responsive sigil size (reuse SigilPage sizing logic, simplified)
     ────────────────────────────────────────────────────────── */
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const verticalReserve =
          vw < 640
            ? Math.max(220, Math.min(360, vh * 0.48))
            : Math.max(160, Math.min(320, vh * 0.35));

        const maxByViewport = Math.max(
          160,
          Math.min(640, Math.min(vw, vh - verticalReserve))
        );

        const frameW = frameRef.current?.clientWidth ?? vw;
        const maxByFrame = Math.max(160, Math.min(640, frameW - 24));

        const size = Math.round(Math.min(maxByViewport, maxByFrame));
        setSigilSize(size);
      });
    };

    const node = frameRef.current ?? document.body;
    const ro = new ResizeObserver(() => compute());
    ro.observe(node);
    window.addEventListener("resize", compute, { passive: true });
    compute();

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ──────────────────────────────────────────────────────────
     Source detection (derived, not stored)
     ────────────────────────────────────────────────────────── */
  const source: SourceKind = useMemo(() => {
    if (filePayload) return "upload";
    if (urlPayload) return "query";
    if (!urlLoading) return "none";
    return "none";
  }, [filePayload, urlPayload, urlLoading]);

  /* ──────────────────────────────────────────────────────────
     Breath Proof computation (no synchronous setState in effect)
     ────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // If there is no payload, clear state asynchronously and bail.
      if (!payload) {
        if (cancelled) return;
        setBreathProof(null);
        setError(null);
        return;
      }

      if (cancelled) return;
      setError(null);

      try {
        const stepsNum: number =
          (payload.stepsPerBeat ?? STEPS_PER_BEAT) as number;
        const sealedIdx = stepIndexFromPulse(payload.pulse, stepsNum);
        const intention = readIntentionSigil(payload);

        const sigmaString = verifierSigmaString(
          payload.pulse,
          payload.beat,
          sealedIdx,
          String(payload.chakraDay ?? ""),
          intention
        );

        const sigmaHash = await sha256HexCanon(sigmaString);
        const derivedPhiKey = await derivePhiKeyFromSigCanon(sigmaHash);

        const sigmaMatches =
          typeof payload.kaiSignature === "string" &&
          payload.kaiSignature.toLowerCase() === sigmaHash.toLowerCase();

        const phiMatches =
          typeof payload.userPhiKey === "string" &&
          payload.userPhiKey.toLowerCase() === derivedPhiKey.toLowerCase();

        const proof: BreathProof = {
          pulse: payload.pulse,
          beat: payload.beat,
          stepsPerBeat: stepsNum,
          stepIndex: sealedIdx,
          chakraDay: String(payload.chakraDay ?? ""),
          intention: intention ?? null,
          sigmaString,
          sigmaHash,
          derivedPhiKey,
          payloadKaiSignature: payload.kaiSignature ?? null,
          payloadUserPhiKey: payload.userPhiKey ?? null,
          matches: { sigma: sigmaMatches, phi: phiMatches },
        };

        if (!cancelled) {
          setBreathProof(proof);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Sigil may be malformed.";
          setBreathProof(null);
          setError(`Failed to compute Breath Proof. ${message}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  /* ──────────────────────────────────────────────────────────
     Derived verification status (no setState here)
     ────────────────────────────────────────────────────────── */
  const status: VerifyStatus = useMemo(() => {
    // No payload
    if (!payload) {
      if (urlLoading) return "checking";
      if (error) return "mismatch";
      return "no-sigil";
    }

    // We have payload
    if (!breathProof && !error) return "checking";

    if (breathProof) {
      return breathProof.matches.sigma && breathProof.matches.phi
        ? "verified"
        : "mismatch";
    }

    // payload + error but no proof
    return "mismatch";
  }, [payload, urlLoading, breathProof, error]);

  /* ──────────────────────────────────────────────────────────
     File upload handler
     ────────────────────────────────────────────────────────── */
  const onFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setError(null);
      setFilePayload(null);
      setFileName(null);
      setBreathProof(null);

      const isSvg =
        /image\/svg\+xml/i.test(file.type) || /\.svg$/i.test(file.name);
      if (!isSvg) {
        setError("Unsupported file. Upload a Kai Sigil as .svg only.");
        return;
      }

      try {
        const text = await file.text();
        const { ok, errors, payload: normalized } =
          validateSvgForVerifier(text);

        if (!ok || !normalized) {
          setError(errors[0] || "Invalid or unsupported Sigil SVG.");
          return;
        }

        setFilePayload(normalized as SigilPayload);
        setFileName(file.name);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not read SVG file.";
        setError(message);
      }
    },
    []
  );

  /* ──────────────────────────────────────────────────────────
     Derived accents & labels
     ────────────────────────────────────────────────────────── */
  const chakraAccent = useMemo(
    () =>
      CHAKRA_THEME[chakraDay as keyof typeof CHAKRA_THEME]?.accent ||
      "#00FFD0",
    [chakraDay]
  );

  const statusLabel = useMemo(() => {
    switch (status) {
      case "verified":
        return "Breath Proof Verified";
      case "mismatch":
        return "Out of Sync";
      case "no-sigil":
        return "No Sigil Loaded";
      case "checking":
      default:
        return "Checking…";
    }
  }, [status]);

  const statusTone = useMemo<"good" | "bad" | "neutral">(() => {
    if (status === "verified") return "good";
    if (status === "mismatch") return "bad";
    return "neutral";
  }, [status]);

  const sourceLabel = useMemo(() => {
    if (source === "upload" && fileName) return `Source · Uploaded: ${fileName}`;
    if (source === "query") return "Source · URL payload (?p=…)";
    return "Source · None";
  }, [source, fileName]);

  /* ──────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────── */

  return (
    <main
      className="sigilpage verify-sigil-page"
      role="main"
      aria-label="Verify Kai Sigil"
      data-version="verify-v1"
    >
      <div className="sp-veil" aria-hidden="true" />
      <div className="sp-veil-stars" aria-hidden="true" />

      <div className="sp-viewport" aria-hidden={false}>
        <section className="sp-shell" data-center>
          {/* Header */}
          <header className="sp-header">
            <h1 className="sp-title">Verify Kai Sigil</h1>
            <p className="sp-subtitle">
              Proof-of-Breath™ verifier for Kairos Sigil-Glyphs. Upload a Sigil
              SVG or open this page with a <code>?p=</code> payload to verify its
              seal.
            </p>
          </header>

          {/* Status pill */}
          <div
            className="verify-status-pill"
            data-tone={statusTone}
            style={{ "--accent-color": chakraAccent } as React.CSSProperties}
          >
            <span className="verify-status-dot" />
            <span className="verify-status-label">{statusLabel}</span>
            <span className="verify-status-source">{sourceLabel}</span>
          </div>

          {/* Upload panel */}
          <section className="verify-panel verify-panel--upload">
            <h2 className="verify-panel__title">1. Load Sigil</h2>
            <p className="verify-panel__hint">
              Option A: Upload the sealed Sigil SVG directly.
              <br />
              Option B: Use a link that includes the <code>?p=</code> payload
              (for example from your KaiKlok / SigilPage share flow).
            </p>

            <label className="verify-upload">
              <input
                type="file"
                accept=".svg,image/svg+xml"
                onChange={onFileChange}
              />
              <span className="verify-upload__body">
                <span className="verify-upload__icon" aria-hidden="true">
                  ⟳
                </span>
                <span className="verify-upload__text">
                  Click to upload Sigil SVG
                  <span className="verify-upload__hint">
                    image/svg+xml · sealed Kairos Sigil
                  </span>
                </span>
              </span>
            </label>

            {error && (
              <p className="verify-error" role="alert">
                {error}
              </p>
            )}
          </section>

          {/* Sigil stage */}
          <section className="verify-panel verify-panel--stage">
            <h2 className="verify-panel__title">2. Sigil Preview</h2>
            <div className="verify-stage" ref={frameRef}>
              {payload ? (
                <div
                  id="verify-sigil-stage"
                  style={{
                    position: "relative",
                    width: sigilSize,
                    height: sigilSize,
                    margin: "0 auto",
                  }}
                >
                  <KaiSigil
                    pulse={payload.pulse}
                    beat={payload.beat}
                    stepPct={stepPct}
                    chakraDay={chakraDay}
                    size={sigilSize}
                    hashMode="deterministic"
                    origin=""
                  />
                </div>
              ) : urlLoading ? (
                <div className="sp-skeleton" aria-hidden="true" />
              ) : (
                <div className="sp-error">
                  Load a Sigil via upload or URL payload to begin verification.
                </div>
              )}
            </div>

            {payload && (
              <dl className="verify-kai-meta">
                <div>
                  <dt>Pulse</dt>
                  <dd>{payload.pulse}</dd>
                </div>
                <div>
                  <dt>Beat</dt>
                  <dd>{payload.beat}/36</dd>
                </div>
                <div>
                  <dt>Step</dt>
                  <dd>
                    {stepIndex + 1}/{steps}
                  </dd>
                </div>
                <div>
                  <dt>Chakra Day</dt>
                  <dd>{chakraDay}</dd>
                </div>
                <div>
                  <dt>Canonical Hash</dt>
                  <dd>{shortHash}</dd>
                </div>
              </dl>
            )}
          </section>

          {/* Breath Proof details */}
          <section className="verify-panel verify-panel--proof">
            <h2 className="verify-panel__title">3. Breath Proof</h2>

            {breathProof && (
              <div className="verify-proof-grid">
                <div className="verify-proof-block">
                  <h3>Seal Moment</h3>
                  <ul>
                    <li>
                      <span className="label">Pulse</span>
                      <span className="value">{breathProof.pulse}</span>
                    </li>
                    <li>
                      <span className="label">Beat / Steps</span>
                      <span className="value">
                        {breathProof.beat}/36 · {breathProof.stepIndex + 1}/
                        {breathProof.stepsPerBeat}
                      </span>
                    </li>
                    <li>
                      <span className="label">Chakra Day</span>
                      <span className="value">
                        {breathProof.chakraDay}
                      </span>
                    </li>
                    <li>
                      <span className="label">Intention</span>
                      <span className="value">
                        {breathProof.intention ?? "—"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="verify-proof-block">
                  <h3>σ · Kai Signature</h3>
                  <ul>
                    <li>
                      <span className="label">Computed σ-string</span>
                      <span className="value mono">
                        {breathProof.sigmaString}
                      </span>
                    </li>
                    <li>
                      <span className="label">Computed σ-hash</span>
                      <span className="value mono">
                        {breathProof.sigmaHash}
                      </span>
                    </li>
                    <li>
                      <span className="label">SVG σ (kaiSignature)</span>
                      <span className="value mono">
                        {breathProof.payloadKaiSignature ?? "missing"}
                      </span>
                    </li>
                    <li>
                      <span className="label">σ match</span>
                      <span className="value">
                        {breathProof.matches.sigma
                          ? "✓ matches"
                          : "✕ mismatch"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="verify-proof-block">
                  <h3>Φ · Owner Key</h3>
                  <ul>
                    <li>
                      <span className="label">Derived Φ-key</span>
                      <span className="value mono">
                        {breathProof.derivedPhiKey}
                      </span>
                    </li>
                    <li>
                      <span className="label">
                        SVG Φ-key (userPhiKey)
                      </span>
                      <span className="value mono">
                        {breathProof.payloadUserPhiKey ?? "missing"}
                      </span>
                    </li>
                    <li>
                      <span className="label">Φ match</span>
                      <span className="value">
                        {breathProof.matches.phi
                          ? "✓ matches"
                          : "✕ mismatch"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {!breathProof && !urlLoading && !payload && !error && (
              <p className="verify-proof-empty">
                Once a Sigil is loaded, this section will show the full Breath
                Proof: σ-string, σ-hash, and derived Φ-key.
              </p>
            )}

            {!breathProof && payload && status === "mismatch" && (
              <p className="verify-proof-empty">
                Could not compute a valid Breath Proof for this Sigil.
              </p>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
