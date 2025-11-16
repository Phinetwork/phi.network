import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState } from "react";
import { VerifierForm } from "./components/VerifierForm";
import { ResultCard } from "./components/ResultCard";
import type { VerificationResult } from "./types";
import VerifySigilPage from "./pages/VerifySigil";

// existing imports...

const App: React.FC = () => {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <h1>verify.kai</h1>
          <p className="header-subtitle">
            Sovereign verifier for Kai Sigils — inspect embedded Kai Signature
            metadata in any KKS-compliant SVG.
          </p>
        </div>
      </header>

      <main className="layout">
        <VerifierForm
          onResult={setResult}
          onLoadingChange={setIsLoading}
        />
        <ResultCard result={result} isLoading={isLoading} />
      </main>
    <BrowserRouter>
      <Routes>


        {/* NEW: verify.kai/verify → VerifySigilPage */}
        <Route path="/verify" element={<VerifySigilPage />} />

        {/* Optional alias: verify.kai/verify/sigil if you want it */}
        {/* <Route path="/verify/sigil" element={<VerifySigilPage />} /> */}

        {/* ...your other routes */}
      </Routes>
    </BrowserRouter>
      <footer className="footer">
        <p>Powered by Kai-Klok · IKANN resolver</p>
      </footer>
    </div>
  );
};



export default App;
