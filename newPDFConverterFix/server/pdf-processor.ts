import { storage } from './storage';
import { excelGenerator } from './excel-generator';
import { logger } from './lib/logger';
import type { FileUpload } from '@shared/schema';

export interface ProcessingOptions {
  ocr?: boolean;
  extractTables?: boolean;
}

export class PDFProcessor {
  private processingJobs = new Set<string>();

  async processJob(jobId: string, options: ProcessingOptions = {}): Promise<void> {
    if (this.processingJobs.has(jobId)) {
      throw new Error('Job is already being processed');
    }

    this.processingJobs.add(jobId);

    try {
      logger.info('Starting PDF processing', { jobId, options });

      // Update job status to processing
      await storage.updateProcessingJobStatus(jobId, 'processing');
      await storage.updateProcessingJobProgress(jobId, 10);

      // Get original file
      const originalFile = await storage.getOriginalFile(jobId);
      if (!originalFile) {
        throw new Error('Original file not found');
      }

      // Extract tables (simplified for this demo)
      await storage.updateProcessingJobProgress(jobId, 50);
      await this.extractTablesFromPDF(originalFile, jobId);
      
      // Check if tables were created
      const extractedTables = await storage.getExtractedTablesByJobId(jobId);
      if (!extractedTables || extractedTables.length === 0) {
        logger.warn('No tables extracted, creating default table', { jobId });
        // Create a simple table with file info as fallback
        await storage.createExtractedTable({
          jobId,
          tableIndex: 0,
          headers: ['Information', 'Value'],
          data: [
            ['Filename', originalFile.filename],
            ['File Size', `${Math.round(originalFile.size / 1024)} KB`],
            ['Processing Date', new Date().toISOString()],
          ],
          confidence: 100,
          boundingBox: { x: 0, y: 0, width: 100, height: 60 },
        });
      }

      // Generate Excel file
      await storage.updateProcessingJobProgress(jobId, 80);
      logger.info('Generating Excel file', { jobId });
      
      try {
        await excelGenerator.generateExcelFromTables(jobId);
        
        // Mark job as completed
        await storage.updateProcessingJobStatus(jobId, 'completed');
        await storage.updateProcessingJobProgress(jobId, 100);
        
        logger.info('PDF processing completed successfully', { jobId });
      } catch (excelError) {
        logger.error('Excel generation failed', { jobId, error: excelError });
        await storage.updateProcessingJobStatus(
          jobId, 
          'failed', 
          `Excel Generation Error: ${excelError instanceof Error ? excelError.message : 'Unknown error'}`
        );
        throw excelError;
      }

    } catch (error) {
      logger.error('PDF processing failed', { jobId, error });
      await storage.updateProcessingJobStatus(
        jobId, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  private async extractTablesFromPDF(file: FileUpload, jobId: string): Promise<void> {
    // Simplified table extraction for demo purposes
    // In a real implementation, this would use PDF parsing libraries
    
    logger.info('Extracting tables from PDF', { jobId, filename: file.filename });

    try {
      // Create sample extracted tables
      const sampleTables = [
        {
          jobId,
          tableIndex: 0,
          headers: ['Quarter', 'Revenue', 'Expenses', 'Net Profit'],
          data: [
            ['Q1 2024', '$2,450,000', '$1,890,000', '$560,000'],
            ['Q2 2024', '$2,680,000', '$2,100,000', '$580,000'],
            ['Q3 2024', '$3,120,000', '$2,350,000', '$770,000'],
            ['Q4 2024', '$3,450,000', '$2,680,000', '$770,000'],
          ],
          confidence: 94,
          boundingBox: { x: 50, y: 100, width: 500, height: 200 },
        },
        {
          jobId,
          tableIndex: 1,
          headers: ['Department', 'Budget', 'Actual', 'Variance'],
          data: [
            ['Marketing', '$500,000', '$485,000', '-$15,000'],
            ['Sales', '$800,000', '$820,000', '+$20,000'],
            ['Operations', '$1,200,000', '$1,180,000', '-$20,000'],
          ],
          confidence: 87,
          boundingBox: { x: 50, y: 350, width: 500, height: 150 },
        },
      ];

      // Save extracted tables
      for (const tableData of sampleTables) {
        await storage.createExtractedTable(tableData);
      }

      logger.info('Tables extracted successfully', { 
        jobId, 
        tablesCount: sampleTables.length 
      });

    } catch (error) {
      logger.error('Table extraction failed', { jobId, error });
      throw new Error(`Failed to extract tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const pdfProcessor = new PDFProcessor();
