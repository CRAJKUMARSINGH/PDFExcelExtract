import { CloudUpload, Eye, Table, Download, FolderOpen, FileStack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useBatchUpload } from "@/hooks/use-batch-upload";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function UploadSection() {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useFileUpload();
  const { uploadFiles, processSampleFolder, isUploading: isBatchUploading, isProcessingSamples } = useBatchUpload();
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

  const handleFileSelect = async (file: File) => {
    try {
      await uploadFile(file, {
        ocr: false,
        extractTables: true,
      });
      toast({
        title: "File uploaded successfully",
        description: "Your PDF is being processed. Check the processing jobs section for updates.",
      });
    } catch (error) {
      // Error toast removed - silent error handling
      console.log('Upload error:', error);
    }
  };

  const handleBatchUpload = async (files: File[]) => {
    try {
      const result = await uploadFiles(files, {
        ocr: false,
        extractTables: true,
      });
      
      toast({
        title: "Batch upload completed",
        description: `${result.data.summary.successful} of ${result.data.summary.total} files uploaded successfully.`,
      });

      if (result.data.errors.length > 0) {
        console.log('Some files failed to upload:', result.data.errors);
      }
    } catch (error) {
      // Error toast removed - silent error handling
      console.log('Batch upload error:', error);
    }
  };

  const handleSampleFolderProcess = async () => {
    try {
      const result = await processSampleFolder({
        ocr: false,
        extractTables: true,
      });
      
      toast({
        title: "Sample folder processing started",
        description: `${result.data.summary.successful} of ${result.data.summary.total} files queued for processing.`,
      });

      if (result.data.errors.length > 0) {
        console.log('Some sample files failed to process:', result.data.errors);
      }
    } catch (error) {
      // Error toast removed - silent error handling
      console.log('Sample folder processing error:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      // Error toast removed - silent error handling
      console.log('Invalid file type attempted');
      return;
    }

    if (uploadMode === 'batch' || pdfFiles.length > 1) {
      handleBatchUpload(pdfFiles);
    } else {
      handleFileSelect(pdfFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) return;

    if (uploadMode === 'batch' || pdfFiles.length > 1) {
      handleBatchUpload(pdfFiles);
    } else {
      handleFileSelect(pdfFiles[0]);
    }
  };

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      handleBatchUpload(pdfFiles);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload PDF Document(s)</h2>
              <p className="text-muted-foreground">Upload PDF files to extract tables and convert to Excel format</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={uploadMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('single')}
                className="flex items-center space-x-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Single</span>
              </Button>
              <Button
                variant={uploadMode === 'batch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('batch')}
                className="flex items-center space-x-2"
              >
                <FileStack className="w-4 h-4" />
                <span>Batch</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSampleFolderProcess}
                disabled={isProcessingSamples}
                className="flex items-center space-x-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>{isProcessingSamples ? 'Processing...' : 'Process Samples'}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div 
          className="drop-zone rounded-lg p-12 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onClick={() => {
            if (uploadMode === 'batch') {
              document.getElementById('folder-input')?.click();
            } else {
              document.getElementById('file-input')?.click();
            }
          }}
          data-testid="drop-zone"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {uploadMode === 'batch' ? (
                <FolderOpen className="text-primary text-2xl" />
              ) : (
                <CloudUpload className="text-primary text-2xl" />
              )}
            </div>
            <div>
              <p className="text-lg font-medium mb-1">
                {uploadMode === 'batch' 
                  ? 'Drop multiple PDF files here or click to browse folder'
                  : 'Drop PDF files here or click to browse'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {uploadMode === 'batch' 
                  ? 'Supports multiple PDF files up to 10MB each'
                  : 'Supports PDF files up to 10MB'
                }
              </p>
            </div>
            <input 
              id="file-input"
              type="file" 
              accept=".pdf" 
              multiple={uploadMode === 'batch'}
              className="hidden" 
              onChange={handleFileInput}
              data-testid="input-file"
            />
            <input 
              id="folder-input"
              type="file" 
              accept=".pdf" 
              multiple
              {...({ webkitdirectory: '' } as any)}
              className="hidden" 
              onChange={handleFolderInput}
              data-testid="input-folder"
            />
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isUploading || isBatchUploading || isProcessingSamples}
                data-testid="button-choose-file"
                onClick={(e) => {
                  e.stopPropagation();
                  if (uploadMode === 'batch') {
                    document.getElementById('folder-input')?.click();
                  } else {
                    document.getElementById('file-input')?.click();
                  }
                }}
              >
                {isUploading || isBatchUploading || isProcessingSamples
                  ? "Processing..." 
                  : uploadMode === 'batch' 
                    ? "Choose Folder" 
                    : "Choose File"
                }
              </Button>
              {uploadMode === 'batch' && (
                <Button 
                  variant="outline"
                  disabled={isUploading || isBatchUploading || isProcessingSamples}
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('file-input')?.click();
                  }}
                >
                  Choose Multiple Files
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Eye className="text-sm" />
            </div>
            <div>
              <p className="font-medium text-sm">OCR Support</p>
              <p className="text-xs text-muted-foreground">Scanned document processing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Table className="text-sm" />
            </div>
            <div>
              <p className="font-medium text-sm">Table Detection</p>
              <p className="text-xs text-muted-foreground">Automatic table identification</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
              <Download className="text-sm" />
            </div>
            <div>
              <p className="font-medium text-sm">Excel Export</p>
              <p className="text-xs text-muted-foreground">Professional formatting</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
