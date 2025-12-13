import {
  type ProcessingJob,
  type InsertProcessingJob,
  type ExtractedTable,
  type InsertExtractedTable,
  type FileUpload,
  type ProcessedFile,
  type JobWithTables,
  type ListJobsParams,
  type ListJobsResult,
  type UpdateJobStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Processing Jobs
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: string): Promise<ProcessingJob | undefined>;
  updateProcessingJobStatus(id: string, status: string, errorMessage?: string): Promise<ProcessingJob | undefined>;
  updateProcessingJobProgress(id: string, progress: number): Promise<ProcessingJob | undefined>;
  listProcessingJobs(params: ListJobsParams): Promise<ListJobsResult>;
  deleteProcessingJob(id: string): Promise<boolean>;
  getJobWithTables(id: string): Promise<JobWithTables | undefined>;

  // Extracted Tables
  createExtractedTable(table: InsertExtractedTable): Promise<ExtractedTable>;
  getExtractedTablesByJobId(jobId: string): Promise<ExtractedTable[]>;
  getExtractedTable(id: string): Promise<ExtractedTable | undefined>;
  deleteExtractedTable(id: string): Promise<boolean>;

  // File Storage
  saveOriginalFile(jobId: string, file: FileUpload): Promise<void>;
  getOriginalFile(jobId: string): Promise<FileUpload | undefined>;
  saveProcessedFile(jobId: string, file: ProcessedFile): Promise<void>;
  getProcessedFile(jobId: string): Promise<ProcessedFile | undefined>;
  deleteOriginalFile(jobId: string): Promise<boolean>;
  deleteProcessedFile(jobId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private processingJobs: Map<string, ProcessingJob>;
  private extractedTables: Map<string, ExtractedTable>;
  private originalFiles: Map<string, FileUpload>;
  private processedFiles: Map<string, ProcessedFile>;

  constructor() {
    this.processingJobs = new Map();
    this.extractedTables = new Map();
    this.originalFiles = new Map();
    this.processedFiles = new Map();
  }

  async createProcessingJob(insertJob: InsertProcessingJob): Promise<ProcessingJob> {
    const id = randomUUID();
    const job: ProcessingJob = {
      ...insertJob,
      id,
      progress: 0,
      uploadedAt: new Date(),
      completedAt: null,
      errorMessage: null,
      status: insertJob.status || 'pending',
      options: insertJob.options || {},
    };
    this.processingJobs.set(id, job);
    return job;
  }

  async getProcessingJob(id: string): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async updateProcessingJobStatus(id: string, status: string, errorMessage?: string): Promise<ProcessingJob | undefined> {
    const job = this.processingJobs.get(id);
    if (!job) return undefined;

    const updatedJob: ProcessingJob = {
      ...job,
      status,
      errorMessage: errorMessage || null,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
    };
    this.processingJobs.set(id, updatedJob);
    return updatedJob;
  }

  async updateProcessingJobProgress(id: string, progress: number): Promise<ProcessingJob | undefined> {
    const job = this.processingJobs.get(id);
    if (!job) return undefined;

    const updatedJob: ProcessingJob = {
      ...job,
      progress: Math.max(0, Math.min(100, progress)),
    };
    this.processingJobs.set(id, updatedJob);
    return updatedJob;
  }

  async listProcessingJobs(params: ListJobsParams): Promise<ListJobsResult> {
    let jobs = Array.from(this.processingJobs.values());
    
    if (params.status) {
      jobs = jobs.filter(job => job.status === params.status);
    }

    jobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
    
    const total = jobs.length;
    const startIndex = (params.page - 1) * params.pageSize;
    const paginatedJobs = jobs.slice(startIndex, startIndex + params.pageSize);

    return {
      jobs: paginatedJobs,
      total,
    };
  }

  async deleteProcessingJob(id: string): Promise<boolean> {
    // Clean up related data
    const tables = await this.getExtractedTablesByJobId(id);
    for (const table of tables) {
      this.extractedTables.delete(table.id);
    }
    
    this.originalFiles.delete(id);
    this.processedFiles.delete(id);
    
    return this.processingJobs.delete(id);
  }

  async getJobWithTables(id: string): Promise<JobWithTables | undefined> {
    const job = await this.getProcessingJob(id);
    if (!job) return undefined;

    const tables = await this.getExtractedTablesByJobId(id);
    return { job, tables };
  }

  async createExtractedTable(insertTable: InsertExtractedTable): Promise<ExtractedTable> {
    const id = randomUUID();
    const table: ExtractedTable = {
      ...insertTable,
      id,
      extractedAt: new Date(),
      data: insertTable.data as string[][],
      headers: (insertTable.headers as string[]) || null,
      confidence: insertTable.confidence || null,
      boundingBox: insertTable.boundingBox || null,
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

  async deleteExtractedTable(id: string): Promise<boolean> {
    return this.extractedTables.delete(id);
  }

  async saveOriginalFile(jobId: string, file: FileUpload): Promise<void> {
    this.originalFiles.set(jobId, file);
  }

  async getOriginalFile(jobId: string): Promise<FileUpload | undefined> {
    return this.originalFiles.get(jobId);
  }

  async saveProcessedFile(jobId: string, file: ProcessedFile): Promise<void> {
    this.processedFiles.set(jobId, file);
  }

  async getProcessedFile(jobId: string): Promise<ProcessedFile | undefined> {
    return this.processedFiles.get(jobId);
  }

  async deleteOriginalFile(jobId: string): Promise<boolean> {
    return this.originalFiles.delete(jobId);
  }

  async deleteProcessedFile(jobId: string): Promise<boolean> {
    return this.processedFiles.delete(jobId);
  }
}

export const storage = new MemStorage();
