import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type ConnectionState = {
  offline: boolean;
  effectiveType: string;
  saveData: boolean;
  downlink: number | null;
};

type PwaSignals = {
  offline: boolean;
  connectionLabel: string;
  connectionHint: string;
  installReady: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  standalone: boolean;
  swVersion: string;
  lastUpdated: number | null;
};

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "dev";

function getConnectionState(): ConnectionState {
  const nav = navigator as Navigator & { connection?: any };
  const conn = nav.connection;
  return {
    offline: !navigator.onLine,
    effectiveType: conn?.effectiveType || "unknown",
    saveData: Boolean(conn?.saveData),
    downlink: typeof conn?.downlink === "number" ? conn.downlink : null,
  };
}

export function usePwaExperience(): PwaSignals {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? (window as any).__bipEvent ?? null : null),
  );
  const [installDismissed, setInstallDismissed] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>(() =>
    typeof navigator !== "undefined" ? getConnectionState() : {
      offline: false,
      effectiveType: "unknown",
      saveData: false,
      downlink: null,
    },
  );
  const [standalone, setStandalone] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
      : false,
  );
  const [swVersion, setSwVersion] = useState<string>(APP_VERSION);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existing = (window as any).__bipWaiters as Array<(ev: BeforeInstallPromptEvent) => void> | undefined;
    if (existing) {
      (window as any).__bipWaiters = existing.concat([(ev) => setInstallEvent(ev)]);
    }

    const onBip = (ev: Event) => {
      ev.preventDefault();
      setInstallEvent(ev as BeforeInstallPromptEvent);
      setInstallDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    const onOnline = () => setConnection(getConnectionState());
    const onOffline = () => setConnection(getConnectionState());
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const nav = navigator as Navigator & { connection?: any };
    const conn = nav.connection;
    const onConnChange = () => setConnection(getConnectionState());
    conn?.addEventListener?.("change", onConnChange);

    const onDisplayMode = (e: MediaQueryListEvent) => setStandalone(e.matches);
    const mql = window.matchMedia("(display-mode: standalone)");
    mql.addEventListener("change", onDisplayMode);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      conn?.removeEventListener?.("change", onConnChange);
      mql.removeEventListener("change", onDisplayMode);
    };
  }, []);

  useEffect(() => {
    const controller = navigator.serviceWorker?.controller;
    if (controller) {
      try {
        const url = new URL(controller.scriptURL);
        const v = url.searchParams.get("v") || APP_VERSION;
        setSwVersion(v);
      } catch {
        setSwVersion(APP_VERSION);
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_ACTIVATED") {
        const v = typeof event.data.version === "string" ? event.data.version : APP_VERSION;
        setSwVersion(v);
        setLastUpdated(Date.now());
      }
    };

    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installEvent) return;
    setInstallDismissed(false);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } finally {
      setInstallEvent(null);
    }
  }, [installEvent]);

  const connectionLabel = useMemo(() => {
    if (connection.offline) return "Offline ready";
    const slow = ["slow-2g", "2g"].includes(connection.effectiveType);
    if (slow) return "Conserving data";
    if (connection.effectiveType === "3g") return "3G • steady";
    if (connection.effectiveType === "4g") return "Fast link";
    return "Adaptive";
  }, [connection]);

  const connectionHint = useMemo(() => {
    if (connection.offline) return "You can keep browsing cached screens."
      + " New data will refresh automatically once you reconnect.";
    if (connection.saveData) return "Data Saver is on. We’ll keep media light.";
    if (connection.downlink && connection.downlink < 1.2) return "We’ll pause heavy downloads until the link improves.";
    return "Live updates stay on. Media is optimized for your link.";
  }, [connection]);

  return {
    offline: connection.offline,
    connectionLabel,
    connectionHint,
    installReady: Boolean(installEvent) && !installDismissed && !standalone,
    promptInstall,
    dismissInstall: () => setInstallDismissed(true),
    standalone,
    swVersion,
    lastUpdated,
  };
}
