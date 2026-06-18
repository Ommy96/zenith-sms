import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/observability/sentry";
import { initPostHog } from "./lib/observability/posthog";

initSentry();
initPostHog();

createRoot(document.getElementById("root")!).render(<App />);
