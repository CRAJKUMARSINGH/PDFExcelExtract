import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { insertProcessingJobSchema } from "@shared/schema";
import { pdfProcessor } from "./pdf-processor";
import { excelGenerator } from "./excel-generator";
import { 
  validate, 
  validateFile, 
  validateSchema, 
  validateRequestId,
  sanitizeInput,
  fileUploadSchema
} from "./lib/validation";
import { query } from "./lib/validation";
import { logger } from "./lib/logger";

// Configure multer for PDF uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Excel files are allowed.'));
    }
  },
});

// Status enum for validation
const JobStatus = z.enum(['pending', 'processing', 'completed', 'failed']);

// Request schemas
const createJobSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  options: z.object({
    ocr: z.boolean().optional().default(false),
    extractTables: z.boolean().optional().default(true),
  }).optional()
});

const updateJobStatusSchema = z.object({
  status: JobStatus,
  error: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Upload PDF/Excel files for processing
  app.post(
    '/api/jobs',
    upload.single('file'),
    validateFile(),
    validateSchema(createJobSchema),
    sanitizeInput,
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            message: 'No file uploaded' 
          });
        }

        // Create processing job
        const job = await storage.createProcessingJob({
          filename: req.file.originalname,
          status: 'pending',
          options: req.body.options || {}
        });

        // Save original file
        await storage.saveOriginalFile(job.id, {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        });

        res.status(201).json({ success: true, data: { jobId: job.id } });
      } catch (error) {
        logger.error('Error creating job', { error });
        next(error);
      }
    }
  );

  // Frontend alias: accepts field name 'pdf'
  app.post(
    '/api/jobs/upload',
    upload.single('pdf'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const job = await storage.createProcessingJob({
          filename: req.file.originalname,
          status: 'pending'
        } as any);

        await storage.saveOriginalFile(job.id, {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size
        });

        res.status(201).json({ success: true, data: { jobId: job.id } });
      } catch (error) {
        logger.error('Error creating job (upload alias)', { error });
        next(error);
      }
    }
  );

  // Start processing a job (OCR + table detection)
  app.post(
    '/api/jobs/:id/process',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const job = await storage.getProcessingJob(req.params.id);
        if (!job) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const original = await storage.getOriginalFile(req.params.id);
        if (!original) {
          return res.status(409).json({ success: false, message: 'Original file missing' });
        }

        // Kick off processing in background
        pdfProcessor.processJob(req.params.id).catch(err => {
          logger.error('Background processing failed', { error: err });
        });

        res.json({ success: true, message: 'Processing started' });
      } catch (error) {
        logger.error('Error starting processing', { error });
        next(error);
      }
    }
  );

  // Reprocess a job and restart processing
  app.post(
    '/api/jobs/:id/reprocess',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const job = await storage.getProcessingJob(req.params.id);
        if (!job) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const tables = await storage.getExtractedTablesByJobId(req.params.id);
        for (const t of tables) {
          await storage.deleteExtractedTable(t.id);
        }
        await storage.deleteExcelFile(req.params.id);

        await storage.updateProcessingJob(req.params.id, {
          status: 'pending',
          progress: 0,
          errorMessage: null as any,
        });

        pdfProcessor.processJob(req.params.id).catch(err => {
          logger.error('Background reprocessing failed', { error: err });
        });

        res.json({ success: true, message: 'Reprocessing started' });
      } catch (error) {
        logger.error('Error reprocessing job', { error });
        next(error);
      }
    }
  );

  // Get job status
  app.get(
    '/api/jobs/:id',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const job = await storage.getProcessingJob(req.params.id);
        if (!job) {
          return res.status(404).json({
            success: false,
            message: 'Job not found',
          });
        }
        
        res.json({ 
          success: true, 
          data: job 
        });
      } catch (error) {
        logger.error('Error fetching job', { error });
        next(error);
      }
    }
  );

  // Get extracted tables for a job
  app.get(
    '/api/jobs/:id/tables',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const jobWithTables = await storage.getJobWithTables(req.params.id);
        if (!jobWithTables) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true, data: jobWithTables.tables });
      } catch (error) {
        logger.error('Error fetching tables', { error });
        next(error);
      }
    }
  );

  // Update job status
  app.patch(
    '/api/jobs/:id/status',
    validate(validateRequestId),
    validateSchema(updateJobStatusSchema),
    sanitizeInput,
    async (req, res, next) => {
      try {
        const job = await storage.updateProcessingJobStatus(
          req.params.id, 
          req.body.status,
          req.body.error
        );
        
        if (!job) {
          return res.status(404).json({
            success: false,
            message: 'Job not found',
          });
        }
        
        res.json({ 
          success: true, 
          data: job 
        });
      } catch (error) {
        logger.error('Error updating job status', { error });
        next(error);
      }
    }
  );

  // Download processed file
  app.get(
    '/api/jobs/:id/download',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const job = await storage.getProcessingJob(req.params.id);
        if (!job || job.status !== 'completed') {
          return res.status(404).json({
            success: false,
            message: 'Processed file not found or job not completed',
          });
        }
        
        const file = await storage.getProcessedFile(job.id);
        if (!file) {
          return res.status(404).json({
            success: false,
            message: 'Processed file not found',
          });
        }
        
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size);
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        
        res.send(file.buffer);
      } catch (error) {
        logger.error('Error downloading file', { error });
        next(error);
      }
    }
  );

  // Download a specific table as Excel
  app.get(
    '/api/jobs/:id/tables/:tableId/download',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const buffer = await excelGenerator.generateTableExcel(req.params.tableId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="table_${req.params.tableId}.xlsx"`);
        res.send(buffer);
      } catch (error) {
        logger.error('Error downloading table excel', { error });
        next(error);
      }
    }
  );

  // List all jobs with pagination
  app.get(
    '/api/jobs',
    validate([
      query('page').optional().isInt({ min: 1 }).toInt(10).default(1),
      query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(10).default(10),
      query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
    ]),
    async (req, res, next) => {
      try {
        const { page, pageSize, status } = req.query as {
          page: number;
          pageSize: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
        };

        const all = await storage.getAllProcessingJobs({ status });
        const total = all.length;
        const start = (page - 1) * pageSize;
        const jobs = all.slice(start, start + pageSize);

        res.json(jobs);
      } catch (error) {
        logger.error('Error listing jobs', { error });
        next(error);
      }
    }
  );

  // Delete a job
  app.delete(
    '/api/jobs/:id',
    validate(validateRequestId),
    async (req, res, next) => {
      try {
        const deleted = await storage.deleteProcessingJob(req.params.id);
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        res.json({ success: true });
      } catch (error) {
        logger.error('Error deleting job', { error });
        next(error);
      }
    }
  );

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message,
      });
    }
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors,
      });
    }
    
    logger.error('Unhandled error', { error: err });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
  });

  return createServer(app);
}
