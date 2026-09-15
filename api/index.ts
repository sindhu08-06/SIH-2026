import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/app";

/**
 * Vercel Serverless Function entry point for Sahakar Seva cooperative platform.
 * Delegates all /api/* requests to the Express application.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Normalize rewrites: if Vercel provides original matched path in headers
  const matchedPath = (req.headers["x-matched-path"] as string) || (req.headers["x-now-route-matches"] as string);
  if (matchedPath && (req.url === "/api" || req.url === "/api/")) {
    req.url = matchedPath;
  }

  return app(req as any, res as any);
}
