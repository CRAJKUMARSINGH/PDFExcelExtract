import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertProcessingJobSchema } from "@shared/schema";
import { pdfProcessor } from "./pdf-processor";
import { excelGenerator } from "./excel-generator";

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false); // Reject file but don't throw error
    }
  },
});

// Status enum for validation
const JobStatus = z.enum(['pending', 'processing', 'completed', 'failed']);

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload PDF files for processing
  app.post('/api/jobs/upload', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(415).json({ error: 'Only PDF files are allowed' });
      }

      // Create processing job
      const job = await storage.createProcessingJob({
        filename: req.file.originalname,
        status: 'pending'
      });

      // Save original file
      await storage.saveOriginalFile(job.id, {
        buffer: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      });

      // Normalize response to { id, filename } for client compatibility
      res.json({ id: job.id, filename: job.filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });

  // Start processing a job
  app.post('/api/jobs/:id/process', async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getProcessingJob(id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status !== 'pending' && job.status !== 'failed') {
        return res.status(400).json({ error: 'Job cannot be processed in current state' });
      }

      // Verify original PDF exists
      const originalFile = await storage.getOriginalFile(id);
      if (!originalFile) {
        return res.status(409).json({ error: 'Original PDF file not found' });
      }

      // Update job status to processing
      await storage.updateProcessingJob(id, { 
        status: 'processing', 
        progress: 0,
        errorMessage: null 
      });

      // Start background processing
      pdfProcessor.processJob(id).catch(error => {
        console.error(`Background processing failed for job ${id}:`, error);
      });
      
      res.json({ message: 'Processing started' });
    } catch (error) {
      console.error('Process start error:', error);
      res.status(500).json({ error: 'Failed to start processing' });
    }
  });

  // Get processing status
  app.get('/api/jobs/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getProcessingJob(id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({
        id: job.id,
        filename: job.filename,
        status: job.status,
        progress: job.progress,
        uploadedAt: job.uploadedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage
      });
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({ error: 'Failed to get job status' });
    }
  });

  // Get all jobs
  app.get('/api/jobs', async (req, res) => {
    try {
      const { status, limit } = req.query;
      const options: { status?: string; limit?: number } = {};
      
      if (status && typeof status === 'string') {
        const statusResult = JobStatus.safeParse(status);
        if (statusResult.success) {
          options.status = statusResult.data;
        } else {
          return res.status(400).json({ error: 'Invalid status filter' });
        }
      }
      
      if (limit && typeof limit === 'string') {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
          options.limit = parsedLimit;
        } else {
          return res.status(400).json({ error: 'Invalid limit (must be 1-100)' });
        }
      }

      const jobs = await storage.getAllProcessingJobs(options);
      // Enrich jobs with extracted tables and preview counts for client rendering
      const jobsWithTables = await Promise.all(jobs.map(async (job) => {
        const tables = await storage.getExtractedTablesByJobId(job.id);
        const previewTables = tables.map((t) => ({
          ...t,
          rowCount: Array.isArray(t.data) ? t.data.length : 0,
          colCount: Array.isArray(t.headers) ? t.headers.length : 0,
        }));
        return { ...job, tables: previewTables };
      }));

      res.json(jobsWithTables);
    } catch (error) {
      console.error('Get jobs error:', error);
      res.status(500).json({ error: 'Failed to get jobs' });
    }
  });

  // Get job with extracted tables
  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const jobWithTables = await storage.getJobWithTables(id);
      
      if (!jobWithTables) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json(jobWithTables);
    } catch (error) {
      console.error('Get job error:', error);
      res.status(500).json({ error: 'Failed to get job details' });
    }
  });

  // Delete a job
  app.delete('/api/jobs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProcessingJob(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Delete job error:', error);
      res.status(500).json({ error: 'Failed to delete job' });
    }
  });

  // Download Excel file for a specific table
  app.get('/api/jobs/:jobId/tables/:tableId/download', async (req, res) => {
    try {
      const { jobId, tableId } = req.params;
      const { format = 'xlsx' } = req.query;
      
      const table = await storage.getExtractedTable(tableId);
      if (!table || table.jobId !== jobId) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // Check if Excel file is cached
      let excelBuffer = await storage.getExcelFile(jobId, tableId);
      
      if (!excelBuffer) {
        // Generate Excel file on demand
        excelBuffer = await excelGenerator.generateTableExcel(tableId);
      }

      const job = await storage.getProcessingJob(jobId);
      const filename = `${job?.filename || 'table'}_table_${table.tableIndex + 1}.${format}`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Download table error:', error);
      res.status(500).json({ error: 'Failed to download table' });
    }
  });

  // Download all tables as a single Excel file
  app.get('/api/jobs/:id/download', async (req, res) => {
    try {
      const { id } = req.params;
      
      const jobWithTables = await storage.getJobWithTables(id);
      if (!jobWithTables) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (jobWithTables.job.status !== 'completed') {
        return res.status(400).json({ error: 'Job not completed' });
      }

      // Check if combined Excel file is cached
      let excelBuffer = await storage.getExcelFile(id);
      
      if (!excelBuffer) {
        // Generate combined Excel file on demand
        excelBuffer = await excelGenerator.generateJobExcel(id);
      }

      const filename = `${jobWithTables.job.filename.replace('.pdf', '')}_extracted_tables.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(excelBuffer);
    } catch (error) {
      console.error('Download job error:', error);
      res.status(500).json({ error: 'Failed to download job results' });
    }
  });

  // Reprocess a failed job
  app.post('/api/jobs/:id/reprocess', async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getProcessingJob(id);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Clear previous tables and reset job status
      const tables = await storage.getExtractedTablesByJobId(id);
      for (const table of tables) {
        await storage.deleteExtractedTable(table.id);
      }

      // Clear cached Excel files
      await storage.deleteExcelFile(id); // Combined file
      for (const table of tables) {
        await storage.deleteExcelFile(id, table.id); // Individual table files
      }

      await storage.updateProcessingJob(id, { 
        status: 'pending', 
        progress: 0, 
        completedAt: null,
        errorMessage: null 
      });

      res.json({ message: 'Job reset for reprocessing' });
    } catch (error) {
      console.error('Reprocess error:', error);
      res.status(500).json({ error: 'Failed to reprocess job' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
