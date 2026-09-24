import { Router, Request, Response } from "express";
import { GameStateSchema, getJevDecision } from "../services/typesafe.js";

export const jevRouter = Router();

jevRouter.post("/jev-decide", async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = GameStateSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      res.status(400).json({
        error: "Invalid game state schema",
        details: parseResult.error.errors,
      });
      return;
    }

    const decision = await getJevDecision(parseResult.data);
    res.json(decision);
  } catch (error: any) {
    console.error("Error processing Jev decision:", error);
    res.status(500).json({
      error: "Internal Jev decision server error",
      message: error?.message || "Unknown error",
    });
  }
});

jevRouter.get("/health", (_req: Request, res: Response) => {
  const hasKey = Boolean(process.env.JEV_API_KEY || process.env.TYPESAFE_API_KEY);
  res.json({
    status: "ok",
    service: "Jev System 1 Decision Proxy",
    mode: hasKey ? "typesafe-live" : "intelligent-heuristic",
    timestamp: new Date().toISOString(),
  });
});
