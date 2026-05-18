/**
 * Integration tests for Express API routes
 * Covers: health, job CRUD, PDF upload flow, Excel→PDF endpoint
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import * as XLSX from "xlsx";

// ─── Mock heavy dependencies so tests run without native binaries ─────────────

vi.mock("./pdf-processor", () => ({
  pdfProcessor: {
    processJob: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("./excel-generator-enhanced", () => ({
  excelGeneratorEnhanced: {
    generateJobExcel: vi.fn().mockResolvedValue(Buffer.from("XLSX")),
    generateTableExcel: vi.fn().mockResolvedValue(Buffer.from("XLSX")),
  },
}));

vi.mock("./excel-to-pdf", () => ({
  excelToPdfGenerator: {
    generatePdf: vi.fn().mockResolvedValue(Buffer.from("%PDF-mock")),
  },
}));

// ─── App setup ────────────────────────────────────────────────────────────────

async function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const { registerRoutes } = await import("./routes");
  await registerRoutes(app);
  return app;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePdfBuffer(): Buffer {
  // Minimal valid-looking PDF header
  return Buffer.from("%PDF-1.4 fake content for testing");
}

function makeXlsxBuffer(): Buffer {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["A", "B"], [1, 2]]), "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeTruthy();
  });
});

describe("GET /api/jobs", () => {
  it("returns empty list initially", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/jobs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  it("returns pagination metadata", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/jobs?page=1&pageSize=5");
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(5);
  });
});

describe("POST /api/jobs/upload", () => {
  it("rejects requests with no file", async () => {
    const app = await buildApp();
    const res = await request(app).post("/api/jobs/upload");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects non-PDF files", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/jobs/upload")
      .attach("file", Buffer.from("not a pdf"), {
        filename: "data.xlsx",
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/PDF/i);
  });

  it("accepts a PDF file and returns jobId", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(201);
    expect(res.body.jobId).toBeTruthy();
    expect(res.body.status).toBe("pending");
  });

  it("creates a job that can be retrieved", async () => {
    const app = await buildApp();
    const uploadRes = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "retrieve.pdf",
        contentType: "application/pdf",
      });

    const { jobId } = uploadRes.body;
    const jobRes = await request(app).get(`/api/jobs/${jobId}`);
    expect(jobRes.status).toBe(200);
    expect(jobRes.body.id).toBe(jobId);
    expect(jobRes.body.filename).toBe("retrieve.pdf");
  });
});

describe("GET /api/jobs/:id", () => {
  it("returns 404 for unknown job", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/jobs/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/jobs/:id/tables", () => {
  it("returns empty tables array for a new job", async () => {
    const app = await buildApp();
    const uploadRes = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "tables.pdf",
        contentType: "application/pdf",
      });

    const { jobId } = uploadRes.body;
    const res = await request(app).get(`/api/jobs/${jobId}/tables`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("returns 404 for unknown job", async () => {
    const app = await buildApp();
    const res = await request(app).get("/api/jobs/ghost/tables");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/jobs/:id/status", () => {
  it("updates job status to completed", async () => {
    const app = await buildApp();
    const uploadRes = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "patch.pdf",
        contentType: "application/pdf",
      });

    const { jobId } = uploadRes.body;
    const patchRes = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .send({ status: "completed" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.status).toBe("completed");
  });

  it("rejects invalid status values", async () => {
    const app = await buildApp();
    const uploadRes = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "invalid.pdf",
        contentType: "application/pdf",
      });

    const { jobId } = uploadRes.body;
    const res = await request(app)
      .patch(`/api/jobs/${jobId}/status`)
      .send({ status: "not-a-real-status" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/jobs/:id", () => {
  it("deletes an existing job", async () => {
    const app = await buildApp();
    const uploadRes = await request(app)
      .post("/api/jobs/upload")
      .attach("file", makePdfBuffer(), {
        filename: "delete.pdf",
        contentType: "application/pdf",
      });

    const { jobId } = uploadRes.body;
    const delRes = await request(app).delete(`/api/jobs/${jobId}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Confirm it's gone
    const getRes = await request(app).get(`/api/jobs/${jobId}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 404 when deleting non-existent job", async () => {
    const app = await buildApp();
    const res = await request(app).delete("/api/jobs/ghost");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/excel-to-pdf", () => {
  it("rejects requests with no file", async () => {
    const app = await buildApp();
    const res = await request(app).post("/api/excel-to-pdf");
    expect(res.status).toBe(400);
  });

  it("rejects PDF files (wrong type)", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/excel-to-pdf")
      .attach("file", makePdfBuffer(), {
        filename: "wrong.pdf",
        contentType: "application/pdf",
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Excel/i);
  });

  it("accepts an Excel file and returns a PDF", async () => {
    const app = await buildApp();
    const res = await request(app)
      .post("/api/excel-to-pdf")
      .attach("file", makeXlsxBuffer(), {
        filename: "data.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/pdf/);
    expect(res.headers["content-disposition"]).toMatch(/data\.pdf/);
  });

  it("uses custom title from body field", async () => {
    const { excelToPdfGenerator } = await import("./excel-to-pdf");
    const app = await buildApp();
    await request(app)
      .post("/api/excel-to-pdf")
      .field("title", "My Custom Title")
      .attach("file", makeXlsxBuffer(), {
        filename: "data.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    expect(excelToPdfGenerator.generatePdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      "data.xlsx",
      "My Custom Title"
    );
  });
});
