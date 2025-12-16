import React from "react";
import ReactDOM from "react-dom/client";

// ✅ CSS FIRST (so App.css can be the final authority)
import "./styles.css";
import "./App.css";

import App from "./App";

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
