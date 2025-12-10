// src/pages/sigilstream/status/KaiStatus.tsx
"use client";

/**
 * KaiStatus — Atlantean μpulse Bar
 * v4.7 — SLIM TIMELINE + D/M/Y (KKS-1.0)
 *
 * Goals (per your screenshot):
 * - TOP line is the timeline: Beat:Step • Day • Ark • D/M/Y (ALWAYS one line)
 * - Countdown sits slightly below (full length, never squeezes the top line)
 * - Pulse stays visible always:
 *    - Wide/Tight: Pulse stays on the TOP line after Ark/DMY
 *    - Tiny/Nano: Pulse drops to the lower row (left of countdown, or above if nano)
 * - Never ellipsis, never abbreviate
 * - Adds D#/M#/Y# derived EXACTLY from μpulses (FeedCard parity):
 *    - Day:   1..42
 *    - Month: 1..8
 *    - Year:  0.. (zero-based)
 */

import * as React from "react";
import { useAlignedKaiTicker, useKaiPulseCountdown } from "../core/ticker";
import { pad2 } from "../core/utils";
import {
  epochMsFromPulse,
  microPulsesSinceGenesis,
  N_DAY_MICRO,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  MONTHS_PER_YEAR,
} from "../../../utils/kai_pulse";
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

type LayoutMode = "wide" | "tight" | "tiny" | "nano";
type BottomMode = "row" | "stack";

function layoutForWidth(width: number): LayoutMode {
  if (width > 0 && width < 360) return "nano";
  if (width > 0 && width < 520) return "tiny";
  if (width > 0 && width < 760) return "tight";
  return "wide";
}

function uiScaleFor(layout: LayoutMode): number {
  switch (layout) {
    case "nano":
      return 0.84;
    case "tiny":
      return 0.9;
    case "tight":
      return 0.95;
    default:
      return 1.0;
  }
}

function bottomModeFor(layout: LayoutMode): BottomMode {
  // nano: give countdown its own line (pulse above it), to avoid any squeeze.
  return layout === "nano" ? "stack" : "row";
}

function useElementWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = (): void => {
      const w = Math.round(el.getBoundingClientRect().width);
      setWidth(w);
    };

    read();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => read());
      ro.observe(el);
      return () => ro.disconnect();
    }

    const onResize = (): void => read();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [ref]);

  return width;
}

const ARK_NAMES = [
  "Ignition",
  "Integration",
  "Harmonization",
  "Reflekt",
  "Purify",
  "Dream",
] as const;

type ArkName = (typeof ARK_NAMES)[number];

function arkFromBeat(beat: number): ArkName {
  const b = Number.isFinite(beat) ? Math.floor(beat) : 0;
  const idx = Math.max(0, Math.min(5, Math.floor(b / 6)));
  return ARK_NAMES[idx];
}

/* ─────────────────────────────────────────────────────────────
   KKS-1.0: D/M/Y from μpulses (exact, deterministic) — FeedCard parity
   dayOfMonth: 1..42
   month:      1..8
   year:       0.. (zero-based)
   ───────────────────────────────────────────────────────────── */

/** Euclidean mod (always 0..m-1) */
const modE = (a: bigint, m: bigint): bigint => {
  const r = a % m;
  return r >= 0n ? r : r + m;
};

/** Euclidean floor division (toward −∞) */
const floorDivE = (a: bigint, d: bigint): bigint => {
  if (d === 0n) throw new Error("Division by zero");
  const q = a / d;
  const r = a % d;
  return r === 0n ? q : a >= 0n ? q : q - 1n;
};

const toSafeNumber = (x: bigint): number => {
  const MAX = BigInt(Number.MAX_SAFE_INTEGER);
  const MIN = BigInt(Number.MIN_SAFE_INTEGER);
  if (x > MAX) return Number.MAX_SAFE_INTEGER;
  if (x < MIN) return Number.MIN_SAFE_INTEGER;
  return Number(x);
};

function kaiDMYFromPulseKKS(pulse: number): { day: number; month: number; year: number } {
  // Bridge pulse -> epoch ms (φ-exact) -> μpulses (φ-exact) to match engine behavior.
  const ms = epochMsFromPulse(pulse); // bigint
  const pμ = microPulsesSinceGenesis(ms); // bigint μpulses

  const dayIdx = floorDivE(pμ, N_DAY_MICRO); // bigint days since genesis (can be negative)

  const monthIdx = floorDivE(dayIdx, BigInt(DAYS_PER_MONTH)); // bigint
  const yearIdx = floorDivE(dayIdx, BigInt(DAYS_PER_YEAR)); // bigint

  const dayOfMonth = toSafeNumber(modE(dayIdx, BigInt(DAYS_PER_MONTH))) + 1; // 1..42
  const month = toSafeNumber(modE(monthIdx, BigInt(MONTHS_PER_YEAR))) + 1; // 1..8
  const year = toSafeNumber(yearIdx); // ✅ zero-based year (0..)

  return { day: dayOfMonth, month, year };
}

type KaiStatusVars = React.CSSProperties & {
  ["--kai-progress"]?: number;
  ["--kai-ui-scale"]?: number;
};

export function KaiStatus(): React.JSX.Element {
  const kaiNow = useAlignedKaiTicker();
  const secsLeftAnchor = useKaiPulseCountdown(true);
  const secsLeft = useSmoothCountdown(secsLeftAnchor);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(rootRef);

  const layout: LayoutMode = layoutForWidth(width);
  const bottomMode: BottomMode = bottomModeFor(layout);

  // Pulse sits on TOP line when there’s room; otherwise drops to the bottom row.
  const pulseOnTop = layout === "wide" || layout === "tight";

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
      const t = window.setTimeout(() => setFlash(false), 180);
      return () => window.clearTimeout(t);
    }
    return;
  }, [secsLeftAnchor]);

  const beatStepDisp = `${kaiNow.beat}:${pad2(kaiNow.step)}`;

  const progress = React.useMemo<number>(() => {
    if (secsLeft == null) return 0;
    return clamp01(1 - secsLeft / pulseDur);
  }, [secsLeft, pulseDur]);

  const secsTextFull = secsLeft !== null ? secsLeft.toFixed(6) : "—";
  const secsText = secsLeft !== null ? secsLeft.toFixed(3) : "—";

  const dayNameFull = String(kaiNow.harmonicDay);

  const beatNum =
    typeof kaiNow.beat === "number"
      ? kaiNow.beat
      : Number.parseInt(String(kaiNow.beat), 10) || 0;

  const arkFull: ArkName = arkFromBeat(beatNum);

  const pulseNum =
    typeof kaiNow.pulse === "number"
      ? kaiNow.pulse
      : Number.parseInt(String(kaiNow.pulse), 10) || 0;

  const dmy = React.useMemo(() => kaiDMYFromPulseKKS(pulseNum), [pulseNum]);
  const dmyText = `D${dmy.day}/M${dmy.month}/Y${dmy.year}`;

  const styleVars: KaiStatusVars = React.useMemo(() => {
    return {
      "--kai-progress": progress,
      "--kai-ui-scale": uiScaleFor(layout),
    };
  }, [progress, layout]);

  const Countdown = (
    <div className="kai-status__countdown" aria-label="Next pulse">
      <span className="kai-status__nLabel">NEXT</span>
      <span
        className="kai-status__nVal"
        title={secsTextFull}
        aria-label={`Next pulse in ${secsTextFull} seconds`}
      >
        {secsText}
        <span className="kai-status__nUnit">s</span>
      </span>
    </div>
  );

  const PulsePill = (
    <span
      className="kai-pill kai-pill--pulse"
      title={`Pulse ${pulseNum}`}
      aria-label={`Pulse ${pulseNum}`}
    >
      ☤KAI: <strong className="kai-pill__num">{pulseNum}</strong>
    </span>
  );

  return (
    <div
      ref={rootRef}
      className={`kai-feed-status kai-feed-status--slim${
        flash ? " kai-feed-status--flash" : ""
      }`}
      role="status"
      aria-live="polite"
      data-layout={layout}
      data-bottom={bottomMode}
      data-kai-bsi={beatStepDisp}
      data-kai-ark={arkFull}
      data-kai-dmy={dmyText}
      style={styleVars}
    >
      {/* TOP: timeline must stay on ONE line (scrolls horizontally if needed) */}
      <div className="kai-status__top" aria-label="Kai timeline">
        <span className="kai-status__bsiWrap" aria-label={`Beat step ${beatStepDisp}`}>
          <span className="kai-status__kLabel" aria-hidden="true">
            KAIROS
          </span>
          <span className="kai-status__bsi" title={beatStepDisp}>
            {beatStepDisp}
          </span>
        </span>

        <span className="kai-pill kai-pill--dmy" title={dmyText} aria-label={`Date ${dmyText}`}>
          {dmyText}
        </span>

        <span
          className="kai-pill kai-pill--day"
          title={dayNameFull}
          aria-label={`Day ${dayNameFull}`}
        >
          {dayNameFull}
        </span>

        <span className="kai-pill kai-pill--ark" title={arkFull} aria-label={`Ark ${arkFull}`}>
          {arkFull}
        </span>

        {pulseOnTop ? PulsePill : null}
      </div>

      {/* BOTTOM: countdown slightly below (full length). Pulse drops here on tiny/nano. */}
      <div className="kai-status__bottom" aria-label="Next pulse row">
        {pulseOnTop ? null : PulsePill}
        {Countdown}
      </div>

      {/* Progress bar (always present) */}
      <div className="kai-feed-status__bar" aria-hidden="true">
        <div className="kai-feed-status__barFill" />
        <div className="kai-feed-status__barSpark" />
      </div>
    </div>
  );
}

export default KaiStatus;
