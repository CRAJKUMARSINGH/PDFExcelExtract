import { useState, useEffect } from 'react'
import { FileUploadZone } from '@/components/FileUploadZone'
import { ProcessingPipeline } from '@/components/ProcessingPipeline'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Zap, Download, ArrowRight } from 'lucide-react'
import type { ProcessingStatus, TablePreview as TablePreviewType } from '@shared/schema'

// todo: remove mock functionality
interface ProcessingJob {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  uploadedAt: Date
  completedAt?: Date
  progress: number
  tables: TablePreviewType[]
  errorMessage?: string
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('upload')
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [jobs, setJobs] = useState<ProcessingJob[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // todo: remove mock functionality
  const handleFilesUploaded = (files: File[]) => {
    console.log('Files uploaded for processing:', files.map(f => f.name))
    
    files.forEach((file, index) => {
      const jobId = `job-${Date.now()}-${index}`
      const newJob: ProcessingJob = {
        id: jobId,
        filename: file.name,
        status: 'pending',
        uploadedAt: new Date(),
        progress: 0,
        tables: []
      }
      
      setJobs(prev => [...prev, newJob])
      setCurrentJobId(jobId)
      
      // Start processing simulation
      setTimeout(() => {
        startProcessingSimulation(jobId, file.name)
      }, 1000)
    })
    
    setActiveTab('processing')
  }

  // todo: remove mock functionality - simulate processing pipeline
  const startProcessingSimulation = (jobId: string, filename: string) => {
    const steps = [
      { step: 'upload', progress: 25, message: 'File uploaded successfully', duration: 1000 },
      { step: 'ocr', progress: 50, message: 'Extracting text from scanned pages...', duration: 3000 },
      { step: 'table-detection', progress: 75, message: 'Detecting and analyzing table structures...', duration: 2500 },
      { step: 'excel-generation', progress: 90, message: 'Generating Excel files...', duration: 1500 },
      { step: 'complete', progress: 100, message: 'Processing completed successfully!', duration: 500 }
    ]

    let currentStep = 0
    
    const processNextStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep]
        setProcessingStatus({
          step: step.step as any,
          progress: step.progress,
          message: step.message
        })
        
        // Update job status
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: step.step === 'complete' ? 'completed' : 'processing', progress: step.progress }
            : job
        ))
        
        if (step.step === 'complete') {
          // Add mock extracted tables
          const mockTables: TablePreviewType[] = [
            {
              id: 'table-001',
              headers: ['Month', 'Revenue', 'Expenses', 'Profit', 'Growth %'],
              data: [
                ['January', '$125,000', '$78,000', '$47,000', '8.5%'],
                ['February', '$132,000', '$81,000', '$51,000', '12.3%'],
                ['March', '$145,000', '$85,000', '$60,000', '18.7%'],
                ['April', '$138,000', '$83,000', '$55,000', '15.2%'],
                ['May', '$156,000', '$89,000', '$67,000', '22.1%'],
                ['June', '$168,000', '$92,000', '$76,000', '28.4%']
              ],
              confidence: 94,
              rowCount: 6,
              colCount: 5
            },
            {
              id: 'table-002',
              headers: ['Department', 'Budget', 'Actual', 'Variance', 'Status'],
              data: [
                ['Marketing', '$50,000', '$48,500', '-$1,500', 'Under Budget'],
                ['Sales', '$80,000', '$82,300', '+$2,300', 'Over Budget'],
                ['R&D', '$120,000', '$115,800', '-$4,200', 'Under Budget'],
                ['Operations', '$95,000', '$97,200', '+$2,200', 'Over Budget']
              ],
              confidence: 89,
              rowCount: 4,
              colCount: 5
            }
          ]
          
          setJobs(prev => prev.map(job => 
            job.id === jobId 
              ? { ...job, status: 'completed', completedAt: new Date(), tables: mockTables }
              : job
          ))
          
          setActiveTab('results')
        }
        
        currentStep++
        setTimeout(processNextStep, step.duration)
      }
    }
    
    processNextStep()
  }

  const handleDownloadAll = (jobId: string) => {
    console.log('Download all tables for job:', jobId)
    // todo: implement actual download
  }

  const handleDownloadTable = (tableId: string, format: 'xlsx' | 'csv') => {
    console.log(`Download ${format.toUpperCase()} for table:`, tableId)
    // todo: implement actual download
  }

  const handleReprocess = (jobId: string) => {
    console.log('Reprocess job:', jobId)
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      startProcessingSimulation(jobId, job.filename)
      setCurrentJobId(jobId)
      setActiveTab('processing')
    }
  }

  const handleDelete = (jobId: string) => {
    console.log('Delete job:', jobId)
    setJobs(prev => prev.filter(job => job.id !== jobId))
    if (currentJobId === jobId) {
      setCurrentJobId(null)
      setProcessingStatus(null)
    }
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

              <FileUploadZone onFilesUploaded={handleFilesUploaded} />
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
              jobs={jobs}
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