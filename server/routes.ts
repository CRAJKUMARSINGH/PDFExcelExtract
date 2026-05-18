import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { pdfProcessor } from "./pdf-processor";
import { excelGeneratorEnhanced as excelGenerator } from "./excel-generator-enhanced";
import { logger } from "./lib/logger";
import { excelToPdfGenerator } from "./excel-to-pdf";

// ─── Multer ───────────────────────────────────────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Excel files are accepted."));
    }
  },
});

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const JobStatus = z.enum(["pending", "processing", "completed", "failed"]);

const updateJobStatusSchema = z.object({
  status: JobStatus,
  error: z.string().optional(),
});

// ─── Route registration ───────────────────────────────────────────────────────

export async function registerRoutes(app: Express): Promise<Server> {

  // ── Health ──────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Upload PDF → start processing job ──────────────────────────────────────
  // This is the primary endpoint used by the PDF→Excel UI panel.
  app.post("/api/jobs/upload", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are accepted for conversion to Excel." });
      }

      // Determine processing mode from form field
      const mode = (req.body.mode as string) || "advanced";
      const useOcr = mode === "ocr";

      // Create job record
      const job = await storage.createProcessingJob({
        filename: req.file.originalname,
        status: "pending",
      });

      // Persist the original file so the processor can read it
      await storage.saveOriginalFile(job.id, {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      // Kick off processing asynchronously
      pdfProcessor
        .processJob(job.id, {
          ocrLanguage: useOcr ? "eng" : undefined,
          confidenceThreshold: 60,
          tableDetectionSensitivity: mode === "basic" ? "low" : "medium",
        })
        .catch((err) => {
          logger.error(`Background processing failed for job ${job.id}`, { error: err });
        });

      res.status(201).json({ jobId: job.id, status: job.status });
    } catch (err) {
      logger.error("Error in /api/jobs/upload", { error: err });
      next(err);
    }
  });

  // ── Get job status ──────────────────────────────────────────────────────────
  app.get("/api/jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await storage.getProcessingJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      res.json(job);
    } catch (err) {
      next(err);
    }
  });

  // ── Get extracted tables for a job ─────────────────────────────────────────
  app.get("/api/jobs/:id/tables", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobWithTables = await storage.getJobWithTables(req.params.id);
      if (!jobWithTables) return res.status(404).json({ error: "Job not found" });
      res.json({ success: true, data: jobWithTables.tables });
    } catch (err) {
      next(err);
    }
  });

  // ── Download Excel for a completed job ─────────────────────────────────────
  app.get("/api/jobs/:id/download", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const job = await storage.getProcessingJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.status !== "completed") {
        return res.status(409).json({ error: `Job is not completed (status: ${job.status})` });
      }

      // Try cached Excel first
      let excelBuffer = await storage.getExcelFile(req.params.id);

      // Generate on-demand if not cached
      if (!excelBuffer) {
        try {
          excelBuffer = await excelGenerator.generateJobExcel(req.params.id);
        } catch (genErr: any) {
          // If no tables were found, generate a placeholder Excel
          if (genErr?.message?.includes('No tables found')) {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([
              ['No tables were detected in this PDF.'],
              ['Try re-uploading with OCR mode enabled for scanned documents.'],
            ]);
            XLSX.utils.book_append_sheet(wb, ws, 'Info');
            excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
          } else {
            logger.error("Excel generation failed", { error: genErr });
            return res.status(500).json({ error: "Failed to generate Excel file" });
          }
        }
      }

      const filename = job.filename.replace(/\.pdf$/i, ".xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (err) {
      next(err);
    }
  });

  // ── Download individual table Excel ────────────────────────────────────────
  app.get("/api/jobs/:id/tables/:tableId/download", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const table = await storage.getExtractedTable(req.params.tableId);
      if (!table || table.jobId !== req.params.id) {
        return res.status(404).json({ error: "Table not found" });
      }

      let excelBuffer = await storage.getExcelFile(req.params.id, req.params.tableId);
      if (!excelBuffer) {
        excelBuffer = await excelGenerator.generateTableExcel(req.params.tableId);
      }

      const job = await storage.getProcessingJob(req.params.id);
      const baseName = (job?.filename || "table").replace(/\.pdf$/i, "");
      const filename = `${baseName}_table_${table.tableIndex + 1}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", excelBuffer.length);
      res.send(excelBuffer);
    } catch (err) {
      next(err);
    }
  });

  // ── List jobs ───────────────────────────────────────────────────────────────
  app.get("/api/jobs", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(String(req.query.page || "1"), 10);
      const pageSize = Math.min(parseInt(String(req.query.pageSize || "20"), 10), 100);
      const status = req.query.status as string | undefined;

      const { jobs, total } = await storage.listProcessingJobs({ page, pageSize, status });
      res.json({
        success: true,
        data: jobs,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  });

  // ── Delete a job ────────────────────────────────────────────────────────────
  app.delete("/api/jobs/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await storage.deleteProcessingJob(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Job not found" });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  // ── Excel → PDF conversion (server-side) ───────────────────────────────────
  // Accepts an Excel/CSV file and returns a PDF.
  app.post("/api/excel-to-pdf", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const allowedMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "Only Excel (.xlsx, .xls) and CSV files are accepted." });
      }

      const title = (req.body.title as string) || req.file.originalname.replace(/\.[^/.]+$/, "");
      const pdfBuffer = await excelToPdfGenerator.generatePdf(req.file.buffer, req.file.originalname, title);

      const pdfFilename = req.file.originalname.replace(/\.(xlsx?|csv)$/i, ".pdf");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${pdfFilename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      logger.error("Error in /api/excel-to-pdf", { error: err });
      next(err);
    }
  });

  // ── Update job status (internal / testing) ─────────────────────────────────
  app.patch("/api/jobs/:id/status", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateJobStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status", details: parsed.error.errors });
      }
      const job = await storage.updateProcessingJob(req.params.id, {
        status: parsed.data.status,
        errorMessage: parsed.data.error,
      });
      if (!job) return res.status(404).json({ error: "Job not found" });
      res.json({ success: true, data: job });
    } catch (err) {
      next(err);
    }
  });

  // ── Global error handler ────────────────────────────────────────────────────
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "File upload error", details: err.message });
    }
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: err.errors });
    }
    logger.error("Unhandled error", { error: err });
    res.status(500).json({
      error: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { details: err?.message }),
    });
  });

  return createServer(app);
}
