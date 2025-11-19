// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VerifierStamper from "./components/VerifierStamper/VerifierStamper";
import VerifySigilPage from "./pages/VerifySigil";
import SigilPage from "./pages/SigilPage/SigilPage";
import SigilExplorer from "./components/SigilExplorer";
import SigilFeedPage from "./pages/SigilFeedPage";
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        {/* Atlantean background layers */}
        <div className="app-bg-orbit" aria-hidden="true" />
        <div className="app-bg-grid" aria-hidden="true" />
        <div className="app-bg-glow" aria-hidden="true" />

        {/* Centered sacred frame */}
        <main className="app-stage" role="main">
          <div className="app-frame">
            <div className="app-frame-inner">
              <Routes>
                {/* Root → VerifierStamper */}
                <Route path="/" element={<VerifierStamper />} />
                {/* Optional secondary route */}
                <Route path="/verify" element={<VerifySigilPage />} />
                        <Route path="/s" element={<SigilPage />} />
          <Route path="/s/:hash" element={<SigilPage />} />
          <Route path="/explorer" element={<SigilExplorer />} />
          <Route path="/feed" element={<SigilFeedPage />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
