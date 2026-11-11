import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AccessibilityProvider } from "./context/AccessibilityContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import "./index.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js")
      .catch((error) => console.warn("[pwa] service worker registration failed:", error?.name || "Error"));
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
          <AccessibilityProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AccessibilityProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
