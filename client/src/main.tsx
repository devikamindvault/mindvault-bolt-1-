import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enable source maps in development
if (process.env.NODE_ENV === 'development') {
  Error.stackTraceLimit = Infinity;
}

createRoot(document.getElementById("root")!).render(<App />);