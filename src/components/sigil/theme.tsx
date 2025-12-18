// src/components/sigil/theme.ts
export const CHAKRA_THEME = {
  Root: {
    hue: 190,
    accent: "#33F6FF", // Glacial cyan — grounding via pure Kai current
  },
  Sacral: {
    hue: 165,
    accent: "#26FFC4", // Aurora teal — creative flow without heat
  },
  "Solar Plexus": {
    hue: 195,
    accent: "#7BE2FF", // Ice halo — luminous will without amber
  },
  Heart: {
    hue: 140,
    accent: "#26FFC4", // Living emerald, breath of coherence (Atlantean glass)
  },
  Throat: {
    hue: 190,
    accent: "#33F6FF", // Aqua truth, harmonic expression
  },
  "Third Eye": {
    hue: 260,
    accent: "#9B5BFF", // Violet indigo, deep inner vision
  },
  Crown: {
    hue: 300,
    accent: "#C18BFF", // Amethyst gate, spiral of return
  },
} as const;


export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);

export default { CHAKRA_THEME, isIOS };
