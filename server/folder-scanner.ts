import fs from 'fs';
import path from 'path';
import { logger } from './lib/logger';

export interface ScanResult {
  folders: string[];
  files: string[];
  totalFiles: number;
}

/**
 * Scans for folders matching a glob pattern and returns PDF files within them
 */
export class FolderScanner {
  private readonly workspaceRoot: string;

  constructor(workspaceRoot = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Find folders matching a pattern (e.g., "sampl*")
   */
  async findFolders(pattern: string): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(this.workspaceRoot, { withFileTypes: true });
      const folders = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => this.matchesPattern(name, pattern));

      logger.info(`Found ${folders.length} folders matching pattern "${pattern}": ${folders.join(', ')}`);
      return folders.map(folder => path.resolve(this.workspaceRoot, folder));
    } catch (error) {
      logger.error('Error scanning for folders', { error, pattern });
      return [];
    }
  }

  /**
   * Find all PDF files in the specified folders
   */
  async findPdfFiles(folderPaths: string[]): Promise<ScanResult> {
    const result: ScanResult = {
      folders: [],
      files: [],
      totalFiles: 0
    };

    for (const folderPath of folderPaths) {
      try {
        const folderName = path.basename(folderPath);
        const exists = await fs.promises.access(folderPath).then(() => true).catch(() => false);
        
        if (!exists) {
          logger.warn(`Folder does not exist: ${folderPath}`);
          continue;
        }

        const entries = await fs.promises.readdir(folderPath);
        const pdfFiles = entries
          .filter(file => file.toLowerCase().endsWith('.pdf'))
          .map(file => path.join(folderPath, file));

        if (pdfFiles.length > 0) {
          result.folders.push(folderPath);
          result.files.push(...pdfFiles);
          result.totalFiles += pdfFiles.length;

          logger.info(`Found ${pdfFiles.length} PDF files in folder "${folderName}"`);
        } else {
          logger.warn(`No PDF files found in folder "${folderName}"`);
        }
      } catch (error) {
        logger.error(`Error scanning folder: ${folderPath}`, { error });
      }
    }

    return result;
  }

  /**
   * Scan for folders matching pattern and return all PDF files
   */
  async scanForPdfFiles(pattern: string): Promise<ScanResult> {
    const folders = await this.findFolders(pattern);
    if (folders.length === 0) {
      logger.warn(`No folders found matching pattern "${pattern}"`);
      return { folders: [], files: [], totalFiles: 0 };
    }

    return await this.findPdfFiles(folders);
  }

  /**
   * Simple pattern matching (supports * wildcard)
   */
  private matchesPattern(name: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(name);
  }

  /**
   * Get relative path from workspace root
   */
  getRelativePath(absolutePath: string): string {
    return path.relative(this.workspaceRoot, absolutePath);
  }
}