import { useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { FileUploader } from '@/components/dashboard/FileUploader'
import { LogTerminal } from '@/components/dashboard/LogTerminal'
import { ProcessingPipeline } from '@/components/ProcessingPipeline'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Zap, Download, ArrowRight } from 'lucide-react'
import { useProcessingJobs } from '@/hooks/useProcessingJobs'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { nanoid } from 'nanoid'

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')
  const [logs, setLogs] = useState<any[]>([])
  const { toast } = useToast()
  
  const {
    jobs,
    currentJob,
    currentJobId,
    setCurrentJobId,
    processingStatus,
    handleFilesUploaded,
    retryJob,
    deleteJob,
    downloadTableExcel,
    downloadAllTablesExcel,
    isUploading,
    isProcessing
  } = useProcessingJobs()

  const addLog = (message: string, level: "info" | "success" | "warning" | "error" = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: nanoid(),
        timestamp: format(new Date(), "HH:mm:ss.SS"),
        level,
        message,
      },
    ]);
  };

  // Handle file upload with real API
  const onFilesUploaded = async (files: File[]) => {
    addLog(`System initialized. Ready to process ${files.length} files.`, "info");
    toast({
      title: "Files uploaded",
      description: `${files.length} PDF files ready for conversion.`,
    });
    
    await handleFilesUploaded(files)
    setActiveTab('processing')
    addLog("Processing started...", "info");
  }

  const handleDownloadAll = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      downloadAllTablesExcel(jobId, job.filename)
      addLog(`Downloading all tables for ${job.filename}`, "success");
    }
  }

  const handleDownloadTable = (tableId: string, format: 'xlsx' | 'csv') => {
    if (format === 'xlsx' && currentJob) {
      downloadTableExcel(currentJob.id, tableId, currentJob.filename)
      addLog(`Downloading table ${tableId}`, "success");
    }
  }

  const handleReprocess = (jobId: string) => {
    retryJob(jobId)
    setCurrentJobId(jobId)
    setActiveTab('processing')
    addLog(`Reprocessing job ${jobId}`, "info");
  }

  const handleDelete = (jobId: string) => {
    deleteJob(jobId)
    addLog(`Deleted job ${jobId}`, "info");
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            PDF to Excel Extractor
          </h1>
          <p className="text-muted-foreground text-lg">
            Extract structured data from scanned PDF documents with intelligent table detection and OCR support.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-2" data-testid="tab-upload">
              <FileText className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center space-x-2" data-testid="tab-processing">
              <Zap className="h-4 w-4" />
              <span>Processing</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2" data-testid="tab-results">
              <Download className="h-4 w-4" />
              <span>Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              {/* How it works */}
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">Upload PDF</h3>
                    <p className="text-xs text-muted-foreground mt-1">Upload your scanned PDF documents</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">AI Processing</h3>
                    <p className="text-xs text-muted-foreground mt-1">OCR and intelligent table detection</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground hidden md:block" />
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-sm">Download Excel</h3>
                    <p className="text-xs text-muted-foreground mt-1">Get formatted Excel files</p>
                  </div>
                </div>
              </Card>

              <FileUploader 
                onFilesSelected={onFilesUploaded} 
                disabled={isUploading || isProcessing}
              />
            </div>
          </TabsContent>

          <TabsContent value="processing" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              {processingStatus ? (
                <ProcessingPipeline
                  status={processingStatus}
                  fileName={currentJobId ? jobs.find(j => j.id === currentJobId)?.filename : undefined}
                  estimatedTime={45}
                />
              ) : (
                <Card className="p-8 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Active Processing</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a PDF file to start the extraction process
                  </p>
                  <Button onClick={() => setActiveTab('upload')} data-testid="button-goto-upload">
                    Upload Files
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <ResultsDashboard
              jobs={jobs as any}
              onDownloadAll={handleDownloadAll}
              onDownloadTable={handleDownloadTable}
              onReprocess={handleReprocess}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>

        <LogTerminal logs={logs} isOpen={logs.length > 0} />
      </div>
    </Shell>
  )
}
