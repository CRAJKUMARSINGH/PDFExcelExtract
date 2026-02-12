import express from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register API routes on the express app. We do not start a server here
// because this file is used by the serverless runtime on Vercel.
void registerRoutes(app);

// Serve built client assets when deployed on Vercel
const staticDir = path.resolve(process.cwd(), "api", "public");
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(staticDir, "index.html"));
  });
}

export default app;

