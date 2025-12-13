import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { storage } from "./storage";
import { pdfProcessor } from "./pdf-processor";
import { excelGenerator } from "./excel-generator";
import { 
  validateSchema, 
  validateFile, 
  validateRequestId, 
  sanitizeInput,
  validate,
  query 
} from "./lib/validation";
import { logger } from "./lib/logger";

// Configure multer for file uploads
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

// Configure multer for batch uploads
const batchUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 50, // Maximum 50 files per batch
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed for batch processing.'));
    }
  },
});

// Request schemas
const createJobSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  options: z.object({
    ocr: z.boolean().optional().default(false),
    extractTables: z.boolean().optional().default(true),
  }).optional().default({})
});

const updateJobStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  errorMessage: z.string().optional(),
});

const batchProcessSchema = z.object({
  folderPath: z.string().min(1, 'Folder path is required'),
  options: z.object({
    ocr: z.boolean().optional().default(false),
    extractTables: z.boolean().optional().default(true),
  }).optional().default({})
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'PDF Excel Extract'
    });
  });

  // Upload PDF files for processing
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

        logger.info('File upload received', { 
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype 
        });

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

        // Start processing in background
        pdfProcessor.processJob(job.id, req.body.options).catch(err => {
          logger.error('Background processing failed', { jobId: job.id, error: err });
        });

        res.status(201).json({
          success: true,
          data: {
            jobId: job.id,
            filename: job.filename,
            status: job.status,
            uploadedAt: job.uploadedAt
          }
        });

      } catch (error) {
        logger.error('Error creating job', { error });
        next(error);
      }
    }
  );

  // Batch upload PDF files for processing
  app.post(
    '/api/jobs/batch',
    batchUpload.array('files', 50),
    validateSchema(z.object({
      options: z.object({
        ocr: z.boolean().optional().default(false),
        extractTables: z.boolean().optional().default(true),
      }).optional().default({})
    })),
    sanitizeInput,
    async (req, res, next) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No files uploaded'
          });
        }

        logger.info('Batch upload received', { 
          fileCount: files.length,
          totalSize: files.reduce((sum, file) => sum + file.size, 0)
        });

        const jobs = [];
        const errors = [];

        // Process each file
        for (const file of files) {
          try {
            // Create processing job
            const job = await storage.createProcessingJob({
              filename: file.originalname,
              status: 'pending',
              options: req.body.options || {}
            });

            // Save original file
            await storage.saveOriginalFile(job.id, {
              buffer: file.buffer,
              filename: file.originalname,
              mimeType: file.mimetype,
              size: file.size
            });

            jobs.push(job);

            // Start processing in background
            pdfProcessor.processJob(job.id, req.body.options).catch(err => {
              logger.error('Background processing failed', { jobId: job.id, error: err });
            });

          } catch (error) {
            logger.error('Error creating job for file', { filename: file.originalname, error });
            errors.push({
              filename: file.originalname,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        res.status(201).json({
          success: true,
          data: {
            jobs: jobs.map(job => ({
              jobId: job.id,
              filename: job.filename,
              status: job.status,
              uploadedAt: job.uploadedAt
            })),
            summary: {
              total: files.length,
              successful: jobs.length,
              failed: errors.length
            },
            errors
          }
        });

      } catch (error) {
        logger.error('Error in batch upload', { error });
        next(error);
      }
    }
  );

  // Process all PDF files from Sample_input_files folder
  app.post(
    '/api/jobs/sample-folder',
    validateSchema(z.object({
      options: z.object({
        ocr: z.boolean().optional().default(false),
        extractTables: z.boolean().optional().default(true),
      }).optional().default({})
    })),
    sanitizeInput,
    async (req, res, next) => {
      try {
        const sampleFolderPath = path.join(process.cwd(), 'Sample_input_files');
        
        // Check if folder exists
        try {
          await fs.access(sampleFolderPath);
        } catch {
          return res.status(404).json({
            success: false,
            message: 'Sample_input_files folder not found'
          });
        }

        // Read all files from the folder
        const files = await fs.readdir(sampleFolderPath);
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');

        if (pdfFiles.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No PDF files found in Sample_input_files folder'
          });
        }

        logger.info('Processing sample folder', { 
          folderPath: sampleFolderPath,
          fileCount: pdfFiles.length
        });

        const jobs = [];
        const errors = [];

        // Process each PDF file
        for (const filename of pdfFiles) {
          try {
            const filePath = path.join(sampleFolderPath, filename);
            const fileBuffer = await fs.readFile(filePath);
            const stats = await fs.stat(filePath);

            // Create processing job
            const job = await storage.createProcessingJob({
              filename,
              status: 'pending',
              options: req.body.options || {}
            });

            // Save original file
            await storage.saveOriginalFile(job.id, {
              buffer: fileBuffer,
              filename,
              mimeType: 'application/pdf',
              size: stats.size
            });

            jobs.push(job);

            // Start processing in background
            pdfProcessor.processJob(job.id, req.body.options).catch(err => {
              logger.error('Background processing failed', { jobId: job.id, error: err });
            });

          } catch (error) {
            logger.error('Error processing file from sample folder', { filename, error });
            errors.push({
              filename,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        res.status(201).json({
          success: true,
          data: {
            jobs: jobs.map(job => ({
              jobId: job.id,
              filename: job.filename,
              status: job.status,
              uploadedAt: job.uploadedAt
            })),
            summary: {
              total: pdfFiles.length,
              successful: jobs.length,
              failed: errors.length
            },
            errors
          }
        });

      } catch (error) {
        logger.error('Error processing sample folder', { error });
        next(error);
      }
    }
  );

  // Get job status
  app.get(
    '/api/jobs/:id',
    validate([validateRequestId()]),
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
    validate([validateRequestId()]),
    async (req, res, next) => {
      try {
        const jobWithTables = await storage.getJobWithTables(req.params.id);
        if (!jobWithTables) {
          return res.status(404).json({ 
            success: false, 
            message: 'Job not found' 
          });
        }

        res.json({ 
          success: true, 
          data: jobWithTables.tables 
        });

      } catch (error) {
        logger.error('Error fetching tables', { error });
        next(error);
      }
    }
  );

  // Download processed Excel file
  app.get(
    '/api/jobs/:id/download',
    validate([validateRequestId()]),
    async (req, res, next) => {
      try {
        const job = await storage.getProcessingJob(req.params.id);
        if (!job) {
          return res.status(404).json({
            success: false,
            message: 'Job not found',
          });
        }

        if (job.status !== 'completed') {
          return res.status(409).json({
            success: false,
            message: `Job not completed. Current status: ${job.status}`,
          });
        }

        const file = await storage.getProcessedFile(job.id);
        if (!file) {
          // Try to generate Excel file if not cached
          logger.info('Processed file not found, generating new one', { jobId: job.id });
          try {
            const buffer = await excelGenerator.generateExcelFromTables(job.id);
            const filename = `${job.filename.replace('.pdf', '')}_extracted_tables.xlsx`;
            
            // Set proper headers for Excel download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Length', buffer.length.toString());
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            
            logger.info('Excel file generated and sent', { 
              jobId: job.id, 
              filename, 
              size: buffer.length 
            });
            
            return res.send(buffer);
          } catch (generateError) {
            logger.error('Failed to generate Excel file', { jobId: job.id, error: generateError });
            return res.status(500).json({
              success: false,
              message: 'Failed to generate Excel file',
              error: generateError instanceof Error ? generateError.message : 'Unknown error'
            });
          }
        }

        // Set proper headers for Excel download
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.size.toString());
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.setHeader('Cache-Control', 'no-cache');

        logger.info('Excel file downloaded', { 
          jobId: job.id, 
          filename: file.filename,
          size: file.size 
        });

        res.send(file.buffer);

      } catch (error) {
        logger.error('Error downloading file', { error });
        next(error);
      }
    }
  );

  // List all jobs with pagination
  app.get(
    '/api/jobs',
    validate([
      query('page').optional().isInt({ min: 1 }).toInt().default(1),
      query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt().default(10),
      query('status').optional().isIn(['pending', 'processing', 'completed', 'failed']),
    ]),
    async (req, res, next) => {
      try {
        const { page, pageSize, status } = req.query as unknown as {
          page: number;
          pageSize: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
        };

        const result = await storage.listProcessingJobs({
          page,
          pageSize,
          status,
        });

        res.json({
          success: true,
          data: result.jobs,
          pagination: {
            page,
            pageSize,
            total: result.total,
            totalPages: Math.ceil(result.total / pageSize),
          },
        });

      } catch (error) {
        logger.error('Error listing jobs', { error });
        next(error);
      }
    }
  );

  // Debug endpoint for Excel generation validation
  app.get(
    '/api/jobs/:id/debug',
    validate([validateRequestId()]),
    async (req, res, next) => {
      try {
        const jobWithTables = await storage.getJobWithTables(req.params.id);
        if (!jobWithTables) {
          return res.status(404).json({ 
            success: false, 
            message: 'Job not found' 
          });
        }

        const { job, tables } = jobWithTables;
        const processedFile = await storage.getProcessedFile(job.id);

        const debugInfo = {
          job: {
            id: job.id,
            filename: job.filename,
            status: job.status,
            progress: job.progress,
            errorMessage: job.errorMessage,
          },
          tables: {
            count: tables.length,
            structures: tables.map(table => ({
              index: table.tableIndex,
              headers: table.headers?.length || 0,
              rows: table.data.length,
              confidence: table.confidence,
              dataValid: Array.isArray(table.data) && table.data.every(row => Array.isArray(row)),
            }))
          },
          excelFile: {
            exists: !!processedFile,
            size: processedFile?.size || 0,
            mimeType: processedFile?.mimeType || 'unknown',
          },
          validation: {
            xlsxLibraryLoaded: !!require('xlsx'),
            dataStructureValid: tables.every(table => 
              Array.isArray(table.data) && 
              table.data.every(row => Array.isArray(row))
            ),
            bufferGenerationReady: tables.length > 0 && tables.every(table => table.data.length > 0),
          }
        };

        res.json({
          success: true,
          data: debugInfo
        });

      } catch (error) {
        logger.error('Error generating debug info', { error });
        res.json({
          success: true,
          data: {
            error: error instanceof Error ? error.message : 'Unknown error',
            validation: {
              xlsxLibraryLoaded: false,
              dataStructureValid: false,
              bufferGenerationReady: false,
            }
          }
        });
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
