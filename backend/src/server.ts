import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { jevRouter } from "./routes/jev.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));

// Route handlers
app.use("/api", jevRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "Deep Space Interceptor Backend",
    endpoints: {
      health: "/api/health",
      jevDecide: "POST /api/jev-decide",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Jev Decision Proxy Server running at http://localhost:${PORT}`);
  const mode = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN
    ? "Live Vercel AI Gateway (typesafe/jev)"
    : process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY
    ? "Live TypeSafe System 1 API"
    : "Intelligent Local Heuristic Engine";
  console.log(`⚡ Mode: ${mode}`);
});
