// src/components/BootFatal.tsx
import React from "react";

export default function BootFatal({ message }: { message: string }): React.JSX.Element {
  const preStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.35,
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.35)",
  };

  const wrapStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  };

  const cardStyle: React.CSSProperties = {
    width: "min(980px, 100%)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(10,12,20,0.75)",
    boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
    padding: 18,
  };

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Kai-Klok Boot Halted (Anchor Missing)
        </div>
        <div style={{ opacity: 0.85, marginBottom: 12 }}>
          App refused to start because Kai NOW cannot be seeded deterministically across devices
          without a build-baked μpulse anchor.
        </div>

        <div style={{ marginBottom: 10, fontWeight: 700 }}>Fatal:</div>
        <div style={preStyle}>{message}</div>

        <div style={{ marginTop: 14, fontWeight: 700 }}>Fix (pick ONE):</div>

        <div style={{ marginTop: 8, opacity: 0.92 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            Option A — Build environment variable (recommended)
          </div>
          <div style={preStyle}>
            1) Set at build time (CI / host / deploy):{"\n"}
            VITE_KAI_ANCHOR_PMICRO={"{\""}{"<BASE10_μPULSES_SINCE_GENESIS>"}{"\"}"}{"\n\n"}
            2) Rebuild + redeploy the bundle.
          </div>

          <div style={{ fontWeight: 700, margin: "12px 0 6px" }}>
            Option B — vite.config.ts define replacement
          </div>
          <div style={preStyle}>
            define: {"{"}{"\n"}
            {"  "}{"'"}import.meta.env.VITE_KAI_ANCHOR_PMICRO{"'"}: JSON.stringify({"'"}{"<BASE10_μPULSES>"}{"'"}),{"\n"}
            {"  "}{"'"}import.meta.env.VITE_KAI_ANCHOR_MICRO{"'"}: JSON.stringify({"'"}{"<BASE10_μPULSES>"}{"'"}),{"\n"}
            {"}"}{"\n\n"}
            Then rebuild + redeploy.
          </div>
        </div>

        <div style={{ marginTop: 10, opacity: 0.75 }}>
          Requirement preserved: no device wall-clock is used; this is a cross-device deterministic seed gate.
        </div>
      </div>
    </div>
  );
}
