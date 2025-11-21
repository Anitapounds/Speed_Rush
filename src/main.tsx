import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import OneLabsProvider from "./providers/OneLabsProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OneLabsProvider>
      <App />
    </OneLabsProvider>
  </StrictMode>
);