import React from "react";
import ReactDOM from "react-dom/client";

// ✅ CSS FIRST (so App.css can be the final authority)
import "./styles.css";
import "./App.css";

import AppRouter from "./router/AppRouter";

const isProduction = import.meta.env.MODE === "production";

function rewriteLegacyHash(): void {
  const h = window.location.hash || "";
  if (!h.startsWith("#/")) return;

  const frag = h.slice(1); // "/stream/p/ABC123?add=...."
  const qMark = frag.indexOf("?");
  const path = (qMark === -1 ? frag : frag.slice(0, qMark)) || "/";
  const query = qMark === -1 ? "" : frag.slice(qMark + 1);

  if (!path.startsWith("/stream/p/")) return;

  const qs = new URLSearchParams(query);
  const add = qs.get("add") || "";
  qs.delete("add");
  const search = qs.toString();

  const newUrl =
    `${path}${search ? `?${search}` : ""}` +
    `${add ? `#add=${add}` : ""}`;

  window.history.replaceState(null, "", newUrl);
}

if (isProduction) {
  window.addEventListener("DOMContentLoaded", rewriteLegacyHash, { once: true });
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

// ✅ Register Kairos Service Worker
if ("serviceWorker" in navigator && isProduction) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => console.log("Kairos Service Worker registered:", reg))
      .catch((err) => console.error("Service Worker error:", err));
  });
}
