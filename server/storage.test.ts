/**
 * Tests for MemStorage — the in-memory data store
 * Covers: jobs CRUD, tables CRUD, file artifacts, Excel cache
 */
import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "./storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStorage() {
  return new MemStorage();
}

async function createJob(storage: MemStorage, filename = "test.pdf") {
  return storage.createProcessingJob({ filename, status: "pending" });
}

// ─── Processing Jobs ──────────────────────────────────────────────────────────

describe("MemStorage — Processing Jobs", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = makeStorage();
  });

  it("creates a job and assigns a UUID id", async () => {
    const job = await createJob(storage);
    expect(job.id).toBeTruthy();
    expect(job.filename).toBe("test.pdf");
    expect(job.status).toBe("pending");
    expect(job.progress).toBe(0);
    expect(job.uploadedAt).toBeInstanceOf(Date);
    expect(job.completedAt).toBeNull();
    expect(job.errorMessage).toBeNull();
  });

  it("retrieves a job by id", async () => {
    const created = await createJob(storage);
    const fetched = await storage.getProcessingJob(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
  });

  it("returns undefined for unknown job id", async () => {
    const result = await storage.getProcessingJob("non-existent-id");
    expect(result).toBeUndefined();
  });

  it("updates job status and progress", async () => {
    const job = await createJob(storage);
    const updated = await storage.updateProcessingJob(job.id, {
      status: "processing",
      progress: 50,
    });
    expect(updated!.status).toBe("processing");
    expect(updated!.progress).toBe(50);
  });

  it("updates job to completed with completedAt timestamp", async () => {
    const job = await createJob(storage);
    const now = new Date();
    const updated = await storage.updateProcessingJob(job.id, {
      status: "completed",
      progress: 100,
      completedAt: now,
    });
    expect(updated!.status).toBe("completed");
    expect(updated!.completedAt).toEqual(now);
  });

  it("updates job to failed with error message", async () => {
    const job = await createJob(storage);
    const updated = await storage.updateProcessingJob(job.id, {
      status: "failed",
      errorMessage: "Something went wrong",
    });
    expect(updated!.status).toBe("failed");
    expect(updated!.errorMessage).toBe("Something went wrong");
  });

  it("returns undefined when updating non-existent job", async () => {
    const result = await storage.updateProcessingJob("ghost", { status: "failed" });
    expect(result).toBeUndefined();
  });

  it("lists all jobs sorted by uploadedAt descending", async () => {
    const j1 = await createJob(storage, "a.pdf");
    await new Promise((r) => setTimeout(r, 5));
    const j2 = await createJob(storage, "b.pdf");

    const { jobs } = await storage.listProcessingJobs();
    expect(jobs[0].id).toBe(j2.id); // most recent first
    expect(jobs[1].id).toBe(j1.id);
  });

  it("filters jobs by status", async () => {
    const j1 = await createJob(storage);
    await storage.updateProcessingJob(j1.id, { status: "completed" });
    await createJob(storage); // stays pending

    const { jobs, total } = await storage.listProcessingJobs({ status: "completed" });
    expect(total).toBe(1);
    expect(jobs[0].id).toBe(j1.id);
  });

  it("paginates job list", async () => {
    for (let i = 0; i < 5; i++) await createJob(storage, `file${i}.pdf`);

    const page1 = await storage.listProcessingJobs({ page: 1, pageSize: 2 });
    const page2 = await storage.listProcessingJobs({ page: 2, pageSize: 2 });

    expect(page1.jobs).toHaveLength(2);
    expect(page2.jobs).toHaveLength(2);
    expect(page1.total).toBe(5);
  });

  it("deletes a job and returns true", async () => {
    const job = await createJob(storage);
    const deleted = await storage.deleteProcessingJob(job.id);
    expect(deleted).toBe(true);
    expect(await storage.getProcessingJob(job.id)).toBeUndefined();
  });

  it("returns false when deleting non-existent job", async () => {
    const result = await storage.deleteProcessingJob("ghost");
    expect(result).toBe(false);
  });
});

// ─── Extracted Tables ─────────────────────────────────────────────────────────

describe("MemStorage — Extracted Tables", () => {
  let storage: MemStorage;
  let jobId: string;

  beforeEach(async () => {
    storage = makeStorage();
    const job = await createJob(storage);
    jobId = job.id;
  });

  it("creates a table and assigns an id", async () => {
    const table = await storage.createExtractedTable({
      jobId,
      tableIndex: 0,
      data: [["a", "b"]],
      headers: ["Col1", "Col2"],
      pageNumber: 1,
    });

    expect(table.id).toBeTruthy();
    expect(table.jobId).toBe(jobId);
    expect(table.tableIndex).toBe(0);
    expect(table.headers).toEqual(["Col1", "Col2"]);
  });

  it("retrieves tables by job id", async () => {
    await storage.createExtractedTable({ jobId, tableIndex: 0, data: [], pageNumber: 1 });
    await storage.createExtractedTable({ jobId, tableIndex: 1, data: [], pageNumber: 1 });

    const tables = await storage.getExtractedTablesByJobId(jobId);
    expect(tables).toHaveLength(2);
    expect(tables[0].tableIndex).toBe(0);
    expect(tables[1].tableIndex).toBe(1);
  });

  it("returns empty array for job with no tables", async () => {
    const tables = await storage.getExtractedTablesByJobId(jobId);
    expect(tables).toHaveLength(0);
  });

  it("retrieves a single table by id", async () => {
    const created = await storage.createExtractedTable({
      jobId,
      tableIndex: 0,
      data: [],
      pageNumber: 1,
    });
    const fetched = await storage.getExtractedTable(created.id);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(created.id);
  });

  it("deletes a table and cascades on job delete", async () => {
    const table = await storage.createExtractedTable({
      jobId,
      tableIndex: 0,
      data: [],
      pageNumber: 1,
    });

    await storage.deleteProcessingJob(jobId);
    const fetched = await storage.getExtractedTable(table.id);
    expect(fetched).toBeUndefined();
  });

  it("getJobWithTables returns job and its tables", async () => {
    await storage.createExtractedTable({ jobId, tableIndex: 0, data: [], pageNumber: 1 });
    const result = await storage.getJobWithTables(jobId);
    expect(result).toBeDefined();
    expect(result!.job.id).toBe(jobId);
    expect(result!.tables).toHaveLength(1);
  });
});

// ─── File Artifacts ───────────────────────────────────────────────────────────

describe("MemStorage — File Artifacts", () => {
  let storage: MemStorage;
  let jobId: string;

  beforeEach(async () => {
    storage = makeStorage();
    const job = await createJob(storage);
    jobId = job.id;
  });

  it("saves and retrieves an original file", async () => {
    const buf = Buffer.from("PDF content");
    await storage.saveOriginalFile(jobId, {
      buffer: buf,
      filename: "test.pdf",
      mimeType: "application/pdf",
      size: buf.length,
    });

    const retrieved = await storage.getOriginalFile(jobId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.filename).toBe("test.pdf");
    expect(retrieved!.buffer.toString()).toBe("PDF content");
  });

  it("returns undefined for missing original file", async () => {
    const result = await storage.getOriginalFile("ghost");
    expect(result).toBeUndefined();
  });

  it("deletes an original file", async () => {
    await storage.saveOriginalFile(jobId, {
      buffer: Buffer.from("x"),
      filename: "x.pdf",
      mimeType: "application/pdf",
      size: 1,
    });
    const deleted = await storage.deleteOriginalFile(jobId);
    expect(deleted).toBe(true);
    expect(await storage.getOriginalFile(jobId)).toBeUndefined();
  });
});

// ─── Excel Cache ──────────────────────────────────────────────────────────────

describe("MemStorage — Excel Cache", () => {
  let storage: MemStorage;
  let jobId: string;

  beforeEach(async () => {
    storage = makeStorage();
    const job = await createJob(storage);
    jobId = job.id;
  });

  it("saves and retrieves an Excel file for a job", async () => {
    const buf = Buffer.from("XLSX data");
    await storage.saveExcelFile(jobId, null, buf);
    const retrieved = await storage.getExcelFile(jobId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.toString()).toBe("XLSX data");
  });

  it("saves and retrieves an Excel file for a specific table", async () => {
    const buf = Buffer.from("table XLSX");
    await storage.saveExcelFile(jobId, "table-1", buf);
    const retrieved = await storage.getExcelFile(jobId, "table-1");
    expect(retrieved).toBeDefined();
    expect(retrieved!.toString()).toBe("table XLSX");
  });

  it("does not mix job-level and table-level cache", async () => {
    await storage.saveExcelFile(jobId, null, Buffer.from("job"));
    await storage.saveExcelFile(jobId, "t1", Buffer.from("table"));

    expect((await storage.getExcelFile(jobId))!.toString()).toBe("job");
    expect((await storage.getExcelFile(jobId, "t1"))!.toString()).toBe("table");
  });

  it("deletes Excel cache entries", async () => {
    await storage.saveExcelFile(jobId, null, Buffer.from("data"));
    await storage.deleteExcelFile(jobId);
    expect(await storage.getExcelFile(jobId)).toBeUndefined();
  });

  it("cleans up Excel cache when job is deleted", async () => {
    await storage.saveExcelFile(jobId, null, Buffer.from("data"));
    await storage.saveExcelFile(jobId, "t1", Buffer.from("table"));
    await storage.deleteProcessingJob(jobId);
    expect(await storage.getExcelFile(jobId)).toBeUndefined();
    expect(await storage.getExcelFile(jobId, "t1")).toBeUndefined();
  });
});
