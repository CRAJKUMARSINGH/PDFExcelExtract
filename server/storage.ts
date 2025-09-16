import { 
  type ProcessingJob, 
  type InsertProcessingJob,
  type ExtractedTable,
  type InsertExtractedTable 
} from "@shared/schema";
import { randomUUID } from "crypto";

// File artifact types
export interface OriginalFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export interface JobWithTables {
  job: ProcessingJob;
  tables: ExtractedTable[];
}

// Safe update types
export interface UpdateJobInput {
  status?: string;
  progress?: number;
  completedAt?: Date | null;
  errorMessage?: string | null;
}

export interface UpdateTableInput {
  data?: any;
  headers?: any;
  confidence?: number;
  boundingBox?: any;
}

export interface IStorage {
  // Processing Jobs
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  getAllProcessingJobs(options?: { status?: string; limit?: number }): Promise<ProcessingJob[]>;
  updateProcessingJob(id: string, updates: UpdateJobInput): Promise<ProcessingJob | undefined>;
  deleteProcessingJob(id: string): Promise<boolean>;
  getJobWithTables(id: string): Promise<JobWithTables | undefined>;
  
  // Extracted Tables
  createExtractedTable(table: InsertExtractedTable): Promise<ExtractedTable>;
  getExtractedTablesByJobId(jobId: string): Promise<ExtractedTable[]>;
  getExtractedTable(id: string): Promise<ExtractedTable | undefined>;
  updateExtractedTable(id: string, updates: UpdateTableInput): Promise<ExtractedTable | undefined>;
  deleteExtractedTable(id: string): Promise<boolean>;
  
  // File artifacts
  saveOriginalFile(jobId: string, file: OriginalFile): Promise<void>;
  getOriginalFile(jobId: string): Promise<OriginalFile | undefined>;
  deleteOriginalFile(jobId: string): Promise<boolean>;
  
  // Excel cache (optional)
  saveExcelFile(jobId: string, tableId: string | null, buffer: Buffer): Promise<void>;
  getExcelFile(jobId: string, tableId?: string): Promise<Buffer | undefined>;
  deleteExcelFile(jobId: string, tableId?: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private processingJobs: Map<string, ProcessingJob>;
  private extractedTables: Map<string, ExtractedTable>;
  private originalFiles: Map<string, OriginalFile>;
  private excelFiles: Map<string, Buffer>; // Key: "jobId" or "jobId:tableId"

  constructor() {
    this.processingJobs = new Map();
    this.extractedTables = new Map();
    this.originalFiles = new Map();
    this.excelFiles = new Map();
  }

  // Processing Jobs
  async createProcessingJob(insertJob: InsertProcessingJob): Promise<ProcessingJob> {
    const id = randomUUID();
    const job: ProcessingJob = {
      ...insertJob,
      id,
      uploadedAt: new Date(),
      completedAt: null,
      errorMessage: null,
      progress: 0
    };
    this.processingJobs.set(id, job);
    return job;
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async getAllProcessingJobs(options?: { status?: string; limit?: number }): Promise<ProcessingJob[]> {
    let jobs = Array.from(this.processingJobs.values());
    
    if (options?.status) {
      jobs = jobs.filter(job => job.status === options.status);
    }
    
    jobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    if (options?.limit) {
      jobs = jobs.slice(0, options.limit);
    }
    
    return jobs;
  }

  async updateProcessingJob(id: string, updates: UpdateJobInput): Promise<ProcessingJob | undefined> {
    const existing = this.processingJobs.get(id);
    if (!existing) return undefined;
    
    // Validate progress bounds
    if (updates.progress !== undefined) {
      updates.progress = Math.max(0, Math.min(100, updates.progress));
    }
    
    const updated = { ...existing, ...updates };
    this.processingJobs.set(id, updated);
    return updated;
  }

  async deleteProcessingJob(id: string): Promise<boolean> {
    // Clean up all related data
    const tables = await this.getExtractedTablesByJobId(id);
    for (const table of tables) {
      this.extractedTables.delete(table.id);
    }
    
    this.originalFiles.delete(id);
    
    // Delete Excel files
    const keysToDelete = Array.from(this.excelFiles.keys()).filter(key => 
      key === id || key.startsWith(`${id}:`)
    );
    for (const key of keysToDelete) {
      this.excelFiles.delete(key);
    }
    
    return this.processingJobs.delete(id);
  }

  async getJobWithTables(id: string): Promise<JobWithTables | undefined> {
    const job = await this.getProcessingJob(id);
    if (!job) return undefined;
    
    const tables = await this.getExtractedTablesByJobId(id);
    return { job, tables };
  }

  // Extracted Tables
  async createExtractedTable(insertTable: InsertExtractedTable): Promise<ExtractedTable> {
    const id = randomUUID();
    const table: ExtractedTable = {
      ...insertTable,
      id,
      extractedAt: new Date()
    };
    this.extractedTables.set(id, table);
    return table;
  }

  async getExtractedTablesByJobId(jobId: string): Promise<ExtractedTable[]> {
    return Array.from(this.extractedTables.values())
      .filter(table => table.jobId === jobId)
      .sort((a, b) => a.tableIndex - b.tableIndex);
  }

  async getExtractedTable(id: string): Promise<ExtractedTable | undefined> {
    return this.extractedTables.get(id);
  }

  async updateExtractedTable(id: string, updates: UpdateTableInput): Promise<ExtractedTable | undefined> {
    const existing = this.extractedTables.get(id);
    if (!existing) return undefined;
    
    // Validate confidence bounds
    if (updates.confidence !== undefined) {
      updates.confidence = Math.max(0, Math.min(100, updates.confidence));
    }
    
    const updated = { ...existing, ...updates };
    this.extractedTables.set(id, updated);
    return updated;
  }

  async deleteExtractedTable(id: string): Promise<boolean> {
    return this.extractedTables.delete(id);
  }

  // File artifacts
  async saveOriginalFile(jobId: string, file: OriginalFile): Promise<void> {
    this.originalFiles.set(jobId, file);
  }

  async getOriginalFile(jobId: string): Promise<OriginalFile | undefined> {
    return this.originalFiles.get(jobId);
  }

  async deleteOriginalFile(jobId: string): Promise<boolean> {
    return this.originalFiles.delete(jobId);
  }

  // Excel cache
  async saveExcelFile(jobId: string, tableId: string | null, buffer: Buffer): Promise<void> {
    const key = tableId ? `${jobId}:${tableId}` : jobId;
    this.excelFiles.set(key, buffer);
  }

  async getExcelFile(jobId: string, tableId?: string): Promise<Buffer | undefined> {
    const key = tableId ? `${jobId}:${tableId}` : jobId;
    return this.excelFiles.get(key);
  }

  async deleteExcelFile(jobId: string, tableId?: string): Promise<boolean> {
    const key = tableId ? `${jobId}:${tableId}` : jobId;
    return this.excelFiles.delete(key);
  }
}

export const storage = new MemStorage();
