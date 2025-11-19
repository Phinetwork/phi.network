"use client";

/**
 * VerifierFrame — Kai-Sigil Verification Panel
 * v2.0 — Atlantean Proof Capsule
 *
 * Purpose:
 * - Render a QR code that encodes the canonical verifier URL for a given Kai-Sigil.
 * - Visually display the key verification facts:
 *    • Pulse
 *    • Kai Signature (short)
 *    • Φ-Key (truncated with full tooltip)
 *    • Chakra Day (if present)
 *    • Optional human caption
 * - Provide direct actions:
 *    • Open verifier in a new tab
 *    • Copy verifier URL to clipboard
 *
 * Design:
 * - Robust against missing / malformed data (graceful fallbacks).
 * - Accessible (aria labels, focus states).
 * - Compact + full variants for embedding in cards, modals, etc.
 */

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import QRCode from "react-qr-code";
import "./styles/VerifierFrame.css";

export interface VerifierFrameProps {
  pulse: number;
  kaiSignature: string;
  phiKey: string;
  caption?: string;
  chakraDay?: string;
  /** Compact mode for tight layouts (sidebars, small cards). */
  compact?: boolean;
  /**
   * Optional override for the base verify URL.
   * Defaults to https://kai.ac/verify/<pulse>-<shortSig>
   * Example: "https://kai.ac/verify"
   */
  verifierBaseUrl?: string;
}

function truncateMiddle(value: string, head = 6, tail = 6): string {
  if (!value) return "";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export default function VerifierFrame({
  pulse,
  kaiSignature,
  phiKey,
  caption,
  chakraDay,
  compact = false,
  verifierBaseUrl = "https://kai.ac/verify",
}: VerifierFrameProps): ReactElement {
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "error">(
    "idle",
  );

  const { shortSig, verifierUrl, truncatedPhiKey } = useMemo(() => {
    const normalizedSig = (kaiSignature ?? "").trim();
    const safeSig =
      normalizedSig.length > 0 ? normalizedSig : "unknown-signature";

    const short =
      safeSig.length > 10
        ? safeSig.slice(0, 10)
        : safeSig || "unknown-sig";

    const url = `${verifierBaseUrl.replace(/\/+$/, "")}/${encodeURIComponent(
      `${pulse}-${short}`,
    )}`;

    return {
      shortSig: short,
      verifierUrl: url,
      truncatedPhiKey: truncateMiddle(phiKey ?? ""),
    };
  }, [kaiSignature, phiKey, pulse, verifierBaseUrl]);

  const qrSize = compact ? 96 : 160;

  const handleCopyLink = async (): Promise<void> => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setCopyStatus("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(verifierUrl);
      setCopyStatus("ok");
      // Soft reset after a moment
      window.setTimeout(() => {
        setCopyStatus("idle");
      }, 2000);
    } catch {
      setCopyStatus("error");
    }
  };

  const rootClass = compact
    ? "kv-verifier kv-verifier--compact"
    : "kv-verifier";

  const pulseLabel =
    Number.isFinite(pulse) && pulse > 0 ? pulse.toString() : "—";

  return (
    <section
      className={rootClass}
      aria-label="Kai-Sigil verification frame"
      data-role="verifier-frame"
    >
      <div
        className="kv-verifier__qr-shell"
        role="img"
        aria-label={`QR code linking to Kai-Sigil verifier for pulse ${pulseLabel} and signature ${shortSig}`}
      >
        <div className="kv-verifier__qr-inner">
          <QRCode
            value={verifierUrl}
            size={qrSize}
            bgColor="#00000000"
            fgColor="#ffffff"
          />
        </div>
      </div>

      <div className="kv-verifier__content">
        <header className="kv-verifier__header">
          <h3 className="kv-verifier__title">Kai-Sigil Verifier</h3>
          <p className="kv-verifier__subtitle">
            Scan or open the verifier link to confirm this post was sealed by
            this Φ-Key.
          </p>
        </header>

        <dl className="kv-verifier__meta">
          <div className="kv-verifier__meta-row">
            <dt className="kv-verifier__meta-label">🌀 Pulse</dt>
            <dd className="kv-verifier__meta-value">{pulseLabel}</dd>
          </div>
          <div className="kv-verifier__meta-row">
            <dt className="kv-verifier__meta-label">Kai Signature</dt>
            <dd className="kv-verifier__meta-value kv-verifier__mono">
              {shortSig}
            </dd>
          </div>
          <div className="kv-verifier__meta-row">
            <dt className="kv-verifier__meta-label">Φ-Key</dt>
            <dd
              className="kv-verifier__meta-value kv-verifier__mono"
              title={phiKey}
            >
              {truncatedPhiKey || "—"}
            </dd>
          </div>
          {chakraDay && (
            <div className="kv-verifier__meta-row">
              <dt className="kv-verifier__meta-label">🧬 Chakra Day</dt>
              <dd className="kv-verifier__meta-value">{chakraDay}</dd>
            </div>
          )}
        </dl>

        {caption && caption.trim().length > 0 && (
          <p className="kv-verifier__caption" aria-label="Post caption">
            “{caption.trim()}”
          </p>
        )}

        <div className="kv-verifier__actions">
          <a
            href={verifierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="kv-verifier__btn kv-verifier__btn--primary"
            data-role="verifier-open-link"
          >
            Open Verifier
          </a>
          <button
            type="button"
            onClick={() => void handleCopyLink()}
            className="kv-verifier__btn kv-verifier__btn--ghost"
            data-role="verifier-copy-link"
          >
            {copyStatus === "ok"
              ? "Copied!"
              : copyStatus === "error"
              ? "Copy failed"
              : "Copy Link"}
          </button>
        </div>

        <p className="kv-verifier__url" aria-label="Verifier URL">
          <span className="kv-verifier__url-label">Verifier URL:</span>
          <span className="kv-verifier__url-value">{verifierUrl}</span>
        </p>
      </div>
    </section>
  );
}
