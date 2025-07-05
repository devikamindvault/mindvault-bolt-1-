import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static quotes data
const quotes = [
  { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { id: 2, text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { id: 3, text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { id: 4, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { id: 5, text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

// Simple API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/api/quotes", (req, res) => {
  res.json(quotes);
});

app.get("/api/quotes/daily", (req, res) => {
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const quoteIndex = dateSeed % quotes.length;
  res.json(quotes[quoteIndex]);
});

// Mock endpoints for compatibility
app.get("/api/goals", (req, res) => {
  res.json([]);
});

app.get("/api/transcriptions", (req, res) => {
  res.json([]);
});

app.get("/api/user-activity", (req, res) => {
  res.json([]);
});

app.get("/api/project-tracking", (req, res) => {
  res.json([]);
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});