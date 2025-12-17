import React from "react";
import ReactDOM from "react-dom/client";

// ✅ CSS FIRST (so App.css can be the final authority)
import "./styles.css";
import "./App.css";

import App from "./App";

// src/main.tsx (top of file, before createRoot/render)
(() => {
  const h = window.location.hash || "";
  if (!h.startsWith("#/")) return;

  // Example: "#/stream/p/ABC123?add=...."
  const frag = h.slice(1); // "/stream/p/ABC123?add=...."
  const qMark = frag.indexOf("?");
  const path = (qMark === -1 ? frag : frag.slice(0, qMark)) || "/";
  const query = qMark === -1 ? "" : frag.slice(qMark + 1);

  // Only rewrite known app routes (so we don't break other hashes)
  if (!path.startsWith("/stream/p/")) return;

  const qs = new URLSearchParams(query);
  const add = qs.get("add") || "";

  // If you also want to preserve other params, keep qs after deleting add:
  qs.delete("add");
  const search = qs.toString();

  const newUrl =
    `${path}${search ? `?${search}` : ""}` +
    `${add ? `#add=${add}` : ""}`;

  // Replace in-place (no extra history entry)
  window.history.replaceState(null, "", newUrl);
})();


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Register Kairos Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => console.log("Kairos Service Worker registered:", reg))
      .catch((err) => console.error("Service Worker error:", err));
  });
}
