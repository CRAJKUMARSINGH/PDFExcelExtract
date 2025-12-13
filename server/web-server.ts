#!/usr/bin/env node

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startWebServer() {
  console.log('🌐 Starting PDFExcelExtract Web Server');
  console.log('====================================');
  
  try {
    // Set development environment
    process.env.NODE_ENV = 'development';
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup vite in development mode
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
      console.log('📦 Vite development server configured');
    } else {
      serveStatic(app);
      console.log('📁 Serving static files');
    }

    // Use port 3000 for development to avoid conflicts
    const port = parseInt(process.env.PORT || '3000', 10);
    
    server.listen(port, '0.0.0.0', () => {
      console.log('');
      console.log('✅ Web server started successfully!');
      console.log('');
      console.log(`🌐 Local:    http://localhost:${port}`);
      console.log(`🌐 Network:  http://127.0.0.1:${port}`);
      console.log('');
      console.log('📋 Available features:');
      console.log('   • PDF file upload');
      console.log('   • Table extraction');
      console.log('   • OCR processing');
      console.log('   • Results dashboard');
      console.log('');
      console.log('Press Ctrl+C to stop the server');
    });

  } catch (error) {
    console.error('❌ Failed to start web server:', error);
    process.exit(1);
  }
}

// Always start the web server
startWebServer();