import { useState } from 'react'
import { FileUploadZone } from '@/components/FileUploadZone'
import { ProcessingPipeline } from '@/components/ProcessingPipeline'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Zap, Download, ArrowRight } from 'lucide-react'
import { useProcessingJobs } from '@/hooks/useProcessingJobs'

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')
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

  // Handle file upload with real API
  const onFilesUploaded = async (files: File[]) => {
    await handleFilesUploaded(files)
    setActiveTab('processing')
  }


  const handleDownloadAll = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      downloadAllTablesExcel(jobId, job.filename)
    }
  }

  const handleDownloadTable = (tableId: string, format: 'xlsx' | 'csv') => {
    if (format === 'xlsx' && currentJob) {
      downloadTableExcel(currentJob.id, tableId, currentJob.filename)
    }
    // CSV format not implemented yet
  }

  const handleReprocess = (jobId: string) => {
    retryJob(jobId)
    setCurrentJobId(jobId)
    setActiveTab('processing')
  }

  const handleDelete = (jobId: string) => {
    deleteJob(jobId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">PDF to Excel Extractor</h1>
              <p className="text-muted-foreground">
                Extract structured data from scanned PDF documents with intelligent table detection
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                OCR Powered
              </Badge>
              <Badge variant="outline" className="text-xs">
                Table Detection
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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

              <FileUploadZone onFilesUploaded={onFilesUploaded} />
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
      </div>
    </div>
  )
}