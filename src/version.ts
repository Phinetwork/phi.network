// src/version.ts
// Shared PWA version constants so the app shell, SW registration, and UI stay in sync.

export const SW_VERSION_EVENT = "kairos:sw-version";
export const DEFAULT_APP_VERSION = "29.5.8"; // Keep in sync with public/sw.js
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || DEFAULT_APP_VERSION;
