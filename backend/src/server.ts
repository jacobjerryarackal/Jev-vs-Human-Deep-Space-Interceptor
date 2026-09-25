import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { jevRouter } from "./routes/jev";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, or missing origin
    if (!origin) return callback(null, true);

    // Allow localhost and any vercel deployment
    if (
      origin.includes("localhost") ||
      origin.endsWith(".vercel.app") ||
      (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim()).includes(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error("Blocked by CORS policy"));
  },
  credentials: true,
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

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[SERVER] Deep Space Interceptor proxy listening on port ${PORT}`);
  const mode = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_TOKEN
    ? "Live Vercel AI Gateway (typesafe/jev)"
    : process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY
    ? "Live TypeSafe System 1 API"
    : "Intelligent Local Heuristic Engine";
  console.log(`⚡ Mode: ${mode}`);
});
