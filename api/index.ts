import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../server/app";
import { createServer } from "http";

// Create a single HTTP server instance to handle requests via Express in Vercel
const server = createServer(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  server.emit("request", req, res as any);
}

