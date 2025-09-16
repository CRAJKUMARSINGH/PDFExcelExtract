import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  validate, 
  validateFile, 
  validateSchema, 
  validateRequestId, 
  sanitizeInput,
  query 
} from './validation';

describe('validation utilities', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('validate', () => {
    it('should call next without validation', () => {
      const middleware = validate([]);
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateFile', () => {
    it('should call next without file validation', () => {
      const middleware = validateFile();
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateSchema', () => {
    it('should call next without schema validation', () => {
      const middleware = validateSchema({});
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateRequestId', () => {
    it('should always return true', () => {
      const result = validateRequestId(mockReq as Request);
      expect(result).toBe(true);
    });
  });

  describe('sanitizeInput', () => {
    it('should call next without sanitizing', () => {
      sanitizeInput(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should return chainable API', () => {
      const queryValidator = query('test');
      expect(queryValidator.optional).toBeDefined();
      expect(queryValidator.isInt).toBeDefined();
      expect(queryValidator.toInt).toBeDefined();
      expect(queryValidator.default).toBeDefined();
      expect(queryValidator.isIn).toBeDefined();
    });

    it('should allow method chaining', () => {
      const result = query('test')
        .optional()
        .isInt()
        .toInt()
        .default(0)
        .isIn([1, 2, 3]);
      
      expect(result).toBeDefined();
    });
  });
});