import React from "react";
import { usePwaExperience } from "../hooks/usePwaExperience";

type Props = {
  emphasize?: boolean;
};

export default function PwaDelight({ emphasize = false }: Props): React.JSX.Element {
  const signals = usePwaExperience();

  const freshnessLabel = signals.lastUpdated
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        Math.round((signals.lastUpdated - Date.now()) / (60 * 1000)),
        "minute",
      )
    : "Live";

  return (
    <div className="pwa-delight" aria-live="polite">
      <div
        className="pwa-card"
        data-variant={signals.offline ? "offline" : "online"}
        data-emphasize={emphasize ? "1" : "0"}
        role="status"
      >
        <div className="pwa-card__header">
          <div className="pwa-card__eyebrow">Mobility concierge</div>
          <div className="pwa-card__title">{signals.connectionLabel}</div>
          <div className="pwa-card__meta">
            <span className="pill">Version {signals.swVersion}</span>
            <span className="pill pill--ghost">{freshnessLabel}</span>
            {signals.standalone && <span className="pill pill--ghost">App installed</span>}
            {signals.offline && <span className="pill">Offline ready</span>}
          </div>
        </div>
        <div className="pwa-card__body">{signals.connectionHint}</div>
      </div>

      {signals.installReady && (
        <div className="pwa-card pwa-card--action" role="status">
          <div className="pwa-card__header">
            <div className="pwa-card__eyebrow">Add to Home</div>
            <div className="pwa-card__title">Install Phi Network</div>
            <div className="pwa-card__meta">
              <span className="pill">1-tap launch</span>
              <span className="pill pill--ghost">Offline shell</span>
            </div>
          </div>
          <div className="pwa-card__body">
            Save the Kairos console to your home screen for instant, full-screen launches and a smoother
            offline-first flow.
          </div>
          <div className="pwa-card__actions">
            <button className="pwa-btn" onClick={() => void signals.promptInstall()}>
              Install now
            </button>
            <button className="pwa-link" onClick={signals.dismissInstall}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
