// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { BASE_APP_VERSION } from "./src/version";

/**
 * Sovereign build constants (NO .env required)
 * - Anything BigInt is injected as a STRING (so it’s JSON-safe and bundler-safe).
 * - Client can read via import.meta.env.* exactly like Vite vars, but fully sealed here.
 */
import {
  GENESIS_TS,
  SOLAR_GENESIS_UTC_TS,
  PULSE_MS,
  N_DAY_MICRO,
  PULSES_STEP,
  STEPS_BEAT,
  BEATS_DAY,
} from "./src/utils/kai_pulse";

const SOVEREIGN_BUILD = {
  appVersion: BASE_APP_VERSION,

  // Kai-Klok anchors (UTC ms; numbers)
  genesisTsMsUtc: GENESIS_TS,
  solarGenesisTsMsUtc: SOLAR_GENESIS_UTC_TS,

  // Display-only (number)
  pulseMs: PULSE_MS,

  // Lattice (numbers + BigInt-as-string)
  pulsesPerStep: PULSES_STEP,
  stepsPerBeat: STEPS_BEAT,
  beatsPerDay: BEATS_DAY,
  nDayMicro: N_DAY_MICRO.toString(),

  /**
   * Optional “built-in” μpulse seed (string) — leave null unless you *intentionally*
   * hard-code a sovereign anchor. Your runtime should still prefer:
   *   checkpoint > signed anchor > localStorage anchor > RTC fallback
   */
  kaiAnchorMicro: null as string | null,
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  define: {
    // Existing
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(BASE_APP_VERSION),

    // Sovereign Kai constants (no env file)
    "import.meta.env.VITE_KAI_GENESIS_TS_MS_UTC": JSON.stringify(GENESIS_TS),
    "import.meta.env.VITE_KAI_SOLAR_GENESIS_TS_MS_UTC": JSON.stringify(SOLAR_GENESIS_UTC_TS),
    "import.meta.env.VITE_KAI_PULSE_MS": JSON.stringify(PULSE_MS),
    "import.meta.env.VITE_KAI_N_DAY_MICRO": JSON.stringify(N_DAY_MICRO.toString()),
    "import.meta.env.VITE_KAI_PULSES_STEP": JSON.stringify(PULSES_STEP),
    "import.meta.env.VITE_KAI_STEPS_BEAT": JSON.stringify(STEPS_BEAT),
    "import.meta.env.VITE_KAI_BEATS_DAY": JSON.stringify(BEATS_DAY),

    // Optional built-in μpulse seed (string | null)
    "import.meta.env.VITE_KAI_ANCHOR_MICRO": JSON.stringify(SOVEREIGN_BUILD.kaiAnchorMicro),

    // One sealed JSON blob for convenience (string)
    "import.meta.env.VITE_SOVEREIGN_BUILD_JSON": JSON.stringify(JSON.stringify(SOVEREIGN_BUILD)),
  },
});