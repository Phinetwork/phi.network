// src/components/KaiVoh/BreathSealer.tsx
"use client";

/**
 * BreathSealer — Kairos breath-encoded sealing step
 * v3.0 — Atlantean Φ-Breath Orb
 *
 * Flow:
 * 1) User taps "Begin Breath".
 * 2) Inhale for 1 Kai pulse (PULSE_MS).
 * 3) Exhale for 1 Kai pulse; at the end:
 *      • sample live Kai via fetchKai()
 *      • derive kaiSignature = BLAKE2b(file.name + "-" + pulse)
 *      • emit SealedPost → parent via onSealComplete
 *
 * This is the ritual gate between raw media and sovereign Kai-stamped post.
 */

import React, { useEffect, useRef, useState } from "react";
import blake from "blakejs";
import { fetchKai } from "../../utils/kai_pulse";
import type { ComposedPost } from "./PostComposer";
import "./styles/BreathSealer.css";

export interface SealedPost {
  pulse: number;
  kaiSignature: string;
  chakraDay: string;
  post: ComposedPost;
}

interface BreathSealerProps {
  post: ComposedPost;
  onSealComplete: (sealed: SealedPost) => void;
}

type BreathPhase = "idle" | "inhale" | "exhale" | "sealed";

const PULSE_MS = 5236; // φ-breath duration

export default function BreathSealer({
  post,
  onSealComplete,
}: BreathSealerProps) {
  const [breathPhase, setBreathPhase] = useState<BreathPhase>("idle");
  const [progress, setProgress] = useState(0); // 0 → 1 across inhale+exhale
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const sealingRef = useRef(false);

  // Clean up timers on unmount
  useEffect(
    () => () => {
      if (timerRef.current != null) {
        window.clearInterval(timerRef.current);
      }
    },
    []
  );

  const clearTimer = (): void => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startBreathCycle = (): void => {
    // prevent double-start while sealing
    if (sealingRef.current) return;

    clearTimer();
    setError(null);
    setBreathPhase("inhale");
    setProgress(0);
    sealingRef.current = false;

    const totalDuration = PULSE_MS * 2;
    const start = performance.now();

    timerRef.current = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - start;

      if (elapsed < PULSE_MS) {
        setBreathPhase("inhale");
      } else if (elapsed < totalDuration) {
        setBreathPhase("exhale");
      } else {
        clearTimer();
        void sealNow();
        return;
      }

      const ratio = Math.min(elapsed / totalDuration, 1);
      setProgress(ratio);
    }, 50);
  };

  const sealNow = async (): Promise<void> => {
    if (sealingRef.current) return;
    sealingRef.current = true;

    try {
      const kai = await fetchKai();
      const pulse = Number(kai.pulse ?? 0);
      const chakraDay =
        typeof kai.chakraDay === "string" && kai.chakraDay.length > 0
          ? kai.chakraDay
          : "Crown";

      const fileName = post.file?.name ?? "unknown";
      const keyMaterial = `${fileName}-${pulse}`;
      const kaiSignature = blake.blake2bHex(keyMaterial, undefined, 32);

      onSealComplete({
        pulse,
        kaiSignature,
        chakraDay,
        post,
      });

      setBreathPhase("sealed");
    } catch (e: unknown) {
      sealingRef.current = false;
      const msg =
        e instanceof Error
          ? e.message
          : "Failed to seal with live Kai pulse. Please try again.";
      setError(msg);
      setBreathPhase("idle");
      setProgress(0);
    }
  };

  const phaseLabel: string = (() => {
    if (error) return "Error";
    switch (breathPhase) {
      case "idle":
        return "Ready to Breathe";
      case "inhale":
        return "Inhale";
      case "exhale":
        return "Exhale";
      case "sealed":
        return "Sealed in Kairos";
      default:
        return "Breath";
    }
  })();

  const inhalePercent = Math.round(Math.min(progress, 0.5) * 200); // 0–100 over first half
  const exhalePercent = Math.round(Math.max(progress - 0.5, 0) * 200); // 0–100 over second half

  const phaseText: string = (() => {
    if (error) return error;
    switch (breathPhase) {
      case "idle":
        return "Tap begin, inhale as the orb expands, exhale as it returns to stillness. We’ll seal at the end of your exhale.";
      case "inhale":
        return `Inhale slowly… ${inhalePercent}%`;
      case "exhale":
        return `Exhale and let go… ${50 + exhalePercent}% — sealing this breath into KaiOS.`;
      case "sealed":
        return "Sealed on a live Kai pulse. Advancing to embed…";
      default:
        return "";
    }
  })();

  const orbEmoji: string = (() => {
    if (error) return "⚠️";
    switch (breathPhase) {
      case "idle":
        return "🌬";
      case "inhale":
        return "🫁";
      case "exhale":
        return "🌀";
      case "sealed":
        return "✨";
      default:
        return "🌬";
    }
  })();

  const fileNameShort =
    post.file?.name && post.file.name.length > 40
      ? `${post.file.name.slice(0, 22)}…${post.file.name.slice(-12)}`
      : post.file?.name ?? "Unnamed glyph";

  return (
    <div
      className="kv-breath-root"
      data-phase={breathPhase}
      aria-live="polite"
    >
      {/* Top meta strip */}
      <div className="kv-breath-meta">
        <div className="kv-breath-meta-left">
          <span className="kv-breath-pill">Breath Seal • φ 5.236s</span>
          <span className="kv-breath-file" title={post.file?.name}>
            {fileNameShort}
          </span>
        </div>
        <div className="kv-breath-meta-right">
          <span className="kv-breath-tag">Live Kai Pulse</span>
        </div>
      </div>

      {/* Orb + progress */}
      <div className="kv-breath-orb-row">
        <div
          className="kv-breath-orb"
          aria-label={`Breath phase: ${phaseLabel}`}
        >
          <div className="kv-breath-orb-inner">
            <span className="kv-breath-orb-emoji">{orbEmoji}</span>
          </div>
          <div
            className="kv-breath-orb-ring"
            style={
              {
                "--kv-breath-progress": progress,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="kv-breath-status">
          <div className="kv-breath-status-row">
            <span className="kv-breath-status-label">{phaseLabel}</span>
            <span className="kv-breath-status-percent">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <p className="kv-breath-status-text">{phaseText}</p>
          <div className="kv-breath-bars">
            <div className="kv-breath-bar">
              <span className="kv-breath-bar-label">Inhale</span>
              <div className="kv-breath-bar-track" aria-hidden="true">
                <div
                  className="kv-breath-bar-fill kv-breath-bar-fill--inhale"
                  style={{ width: `${inhalePercent}%` }}
                />
              </div>
            </div>
            <div className="kv-breath-bar">
              <span className="kv-breath-bar-label">Exhale</span>
              <div className="kv-breath-bar-track" aria-hidden="true">
                <div
                  className="kv-breath-bar-fill kv-breath-bar-fill--exhale"
                  style={{ width: `${exhalePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="kv-breath-actions">
        {breathPhase === "idle" && !sealingRef.current && !error && (
          <button
            type="button"
            onClick={startBreathCycle}
            className="kv-breath-btn kv-breath-btn-primary"
          >
            Begin Breath
          </button>
        )}

        {error && breathPhase === "idle" && (
          <button
            type="button"
            onClick={startBreathCycle}
            className="kv-breath-btn kv-breath-btn-warning"
          >
            Retry Breath Seal
          </button>
        )}

        {breathPhase !== "idle" && breathPhase !== "sealed" && !error && (
          <button
            type="button"
            className="kv-breath-btn kv-breath-btn-ghost"
            disabled
          >
            Sealing on this exhale…
          </button>
        )}

        {breathPhase === "sealed" && (
          <div className="kv-breath-sealed-note">
            Sealed. The stream will remember this breath forever.
          </div>
        )}
      </div>
    </div>
  );
}
