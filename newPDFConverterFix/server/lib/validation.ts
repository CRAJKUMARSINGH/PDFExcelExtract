import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { body, param, query, validationResult } from "express-validator";

export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  options: z.object({
    ocr: z.boolean().optional().default(false),
    extractTables: z.boolean().optional().default(true),
  }).optional().default({}),
});

export function validateSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
}

export function validateFile() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only PDF and Excel files are allowed.",
      });
    }

    if (req.file.size > 10 * 1024 * 1024) { // 10MB
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 10MB.",
      });
    }

    next();
  };
}

export function validateRequestId() {
  return param('id').isUUID().withMessage('Invalid ID format');
}

export function validate(validations: any[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    next();
  };
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Basic sanitization - remove potential XSS
  if (req.body) {
    req.body = JSON.parse(JSON.stringify(req.body));
  }
  next();
}

export { query, body, param };
