import type { Request, Response, NextFunction } from "express";

// No-op validator runner
export function validate(_validators: any): (req: Request, res: Response, next: NextFunction) => void {
  return (_req, _res, next) => next();
}

// No-op file validator
export function validateFile(): (req: Request, res: Response, next: NextFunction) => void {
  return (_req, _res, next) => next();
}

// No-op Zod schema validator shim
export function validateSchema(_schema: any): (req: Request, res: Response, next: NextFunction) => void {
  return (_req, _res, next) => next();
}

// No-op request id validator
export function validateRequestId(_req: Request): boolean {
  return true;
}

// No-op sanitizer middleware
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Could clean req.body/query/params if needed
  next();
}

// Dummy file upload schema placeholder
export const fileUploadSchema = {} as const;

// Lightweight chainable query validator stub used in routes
export function query(_name: string) {
  const api = {
    optional() { return api; },
    isInt(_opts?: any) { return api; },
    toInt(_radix?: number) { return api; },
    default(_value: any) { return api; },
    isIn(_values: any[]) { return api; },
  };
  return api;
}


