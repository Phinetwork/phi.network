// src/pages/sigilstream/status/KaiStatus.tsx
"use client";

import * as React from "react";
import { useAlignedKaiTicker, useKaiPulseCountdown } from "../core/ticker";
import { pad2 } from "../core/utils";
import "./KaiStatus.css";

const DEFAULT_PULSE_DUR_S = 3 + Math.sqrt(5); // 5.2360679…

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Smooth the authoritative countdown so the UI ticks perfectly between hook updates. */
function useSmoothCountdown(anchorSeconds: number | null): number | null {
  const [smooth, setSmooth] = React.useState<number | null>(anchorSeconds);

  const anchorRef = React.useRef<number | null>(anchorSeconds);
  const t0Ref = React.useRef<number>(0);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    anchorRef.current = anchorSeconds;
    t0Ref.current = performance.now();
    setSmooth(anchorSeconds);
  }, [anchorSeconds]);

  React.useEffect(() => {
    let mounted = true;

    const loop = (): void => {
      if (!mounted) return;

      const a = anchorRef.current;
      if (a == null) {
        setSmooth(null);
        rafRef.current = window.requestAnimationFrame(loop);
        return;
      }

      const dt = (performance.now() - t0Ref.current) / 1000;
      setSmooth(Math.max(0, a - dt));

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return smooth;
}

function readPulseDurSeconds(el: HTMLElement | null): number {
  if (!el) return DEFAULT_PULSE_DUR_S;
  const raw = window.getComputedStyle(el).getPropertyValue("--pulse-dur").trim();
  const v = Number.parseFloat(raw);
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_PULSE_DUR_S;
}

type KaiStatusVars = React.CSSProperties & {
  ["--kai-progress"]?: number;
};

export function KaiStatus(): React.JSX.Element {
  const kaiNow = useAlignedKaiTicker();
  const secsLeftAnchor = useKaiPulseCountdown(true);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const secsLeft = useSmoothCountdown(secsLeftAnchor);

  const [pulseDur, setPulseDur] = React.useState<number>(DEFAULT_PULSE_DUR_S);

  React.useEffect(() => {
    setPulseDur(readPulseDurSeconds(rootRef.current));
  }, [kaiNow.pulse]);

  // Boundary flash when anchor wraps (0 → dur).
  const [flash, setFlash] = React.useState<boolean>(false);
  const prevAnchorRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    const prev = prevAnchorRef.current;
    prevAnchorRef.current = secsLeftAnchor;

    if (prev != null && secsLeftAnchor != null && secsLeftAnchor > prev + 0.25) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 200);
      return () => window.clearTimeout(t);
    }
    return;
  }, [secsLeftAnchor]);

  const beatStepDisp = `${kaiNow.beat}:${pad2(kaiNow.step)}`;

  const progress = React.useMemo<number>(() => {
    if (secsLeft == null) return 0;
    return clamp01(1 - secsLeft / pulseDur);
  }, [secsLeft, pulseDur]);

  const secsText = secsLeft !== null ? secsLeft.toFixed(6) : "—";

  const styleVars: KaiStatusVars = React.useMemo(() => {
    return { "--kai-progress": progress };
  }, [progress]);

  return (
    <div
      ref={rootRef}
      className={`kai-feed-status${flash ? " kai-feed-status--flash" : ""}`}
      role="status"
      aria-live="polite"
      data-kai-beat={kaiNow.beat}
      data-kai-step={kaiNow.step}
      data-kai-bsi={beatStepDisp}
      data-kai-pulse={kaiNow.pulse}
      style={styleVars}
    >
      {/* single slim row */}
      <div className="kai-feed-status__left">
        <span className="kai-feed-status__kLabel">KAIROS</span>
        <span className="kai-feed-status__bsi" aria-label={`Beat step ${beatStepDisp}`}>
          {beatStepDisp}
        </span>

        <span className="kai-pill kai-pill--day" title="Harmonic day">
          {kaiNow.harmonicDay}
        </span>
        <span className="kai-pill kai-pill--chakra" title="Chakra day">
          {kaiNow.chakraDay}
        </span>
        <span className="kai-pill kai-pill--pulse" title="Absolute pulse">
          ☤Kai <strong className="kai-pill__num">{kaiNow.pulse}</strong>
        </span>
      </div>

      <div className="kai-feed-status__right" aria-label="Countdown to next pulse">
        <span className="kai-feed-status__nLabel">NEXT</span>
        <span className="kai-feed-status__nVal">
          {secsText}
          <span className="kai-feed-status__nUnit">s</span>
        </span>
      </div>

      {/* thin progress line (doesn't stack; lives inside the same bar) */}
      <div className="kai-feed-status__bar" aria-hidden="true">
        <div className="kai-feed-status__barFill" />
        <div className="kai-feed-status__barSpark" />
      </div>
    </div>
  );
}

export default KaiStatus;
