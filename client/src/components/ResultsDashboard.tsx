import { useState } from 'react'
import { DownloadCloud, RefreshCw, Trash2, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TablePreview } from './TablePreview'
import type { TablePreview as TablePreviewType } from '@shared/schema'

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

interface ResultsDashboardProps {
  jobs: ProcessingJob[]
  onDownloadAll: (jobId: string) => void
  onDownloadTable: (tableId: string, format: 'xlsx' | 'csv') => void
  onReprocess: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function ResultsDashboard({ 
  jobs, 
  onDownloadAll, 
  onDownloadTable, 
  onReprocess, 
  onDelete 
}: ResultsDashboardProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const selectedJobData = selectedJob ? jobs.find(job => job.id === selectedJob) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full" data-testid="results-dashboard">
      {/* Jobs List */}
      <Card className="lg:col-span-1">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Processing History</h2>
          <p className="text-sm text-muted-foreground">
            {jobs.length} total jobs
          </p>
        </div>
        
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DownloadCloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No processing jobs yet</p>
                <p className="text-xs">Upload a PDF to get started</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card
                  key={job.id}
                  className={`p-3 cursor-pointer transition-colors hover-elevate ${
                    selectedJob === job.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedJob(job.id)}
                  data-testid={`job-card-${job.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={job.filename}>
                          {job.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(job.uploadedAt)}
                        </p>
                      </div>
                      {getStatusIcon(job.status)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {getStatusBadge(job.status)}
                      {job.status === 'completed' && (
                        <Badge variant="outline" className="text-xs">
                          {job.tables.length} tables
                        </Badge>
                      )}
                    </div>
                    
                    {job.status === 'failed' && job.errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{job.errorMessage}</p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Job Details */}
      <div className="lg:col-span-2 space-y-4">
        {selectedJobData ? (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedJobData.filename}</h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {formatDate(selectedJobData.uploadedAt)}
                    {selectedJobData.completedAt && 
                      ` • Completed ${formatDate(selectedJobData.completedAt)}`
                    }
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedJobData.status === 'completed' && (
                    <Button 
                      onClick={() => onDownloadAll(selectedJobData.id)}
                      data-testid={`button-download-all-${selectedJobData.id}`}
                    >
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                  
                  {selectedJobData.status === 'failed' && (
                    <Button 
                      variant="outline" 
                      onClick={() => onReprocess(selectedJobData.id)}
                      data-testid={`button-reprocess-${selectedJobData.id}`}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reprocess
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDelete(selectedJobData.id)}
                    data-testid={`button-delete-${selectedJobData.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {selectedJobData.status === 'completed' && selectedJobData.tables.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium">Extracted Tables</h4>
                  <Badge variant="outline">
                    {selectedJobData.tables.length} table{selectedJobData.tables.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {selectedJobData.tables.map((table) => (
                  <TablePreview
                    key={table.id}
                    table={table}
                    onDownload={onDownloadTable}
                    editable={false}
                  />
                ))}
              </div>
            )}

            {selectedJobData.status === 'processing' && (
              <Card className="p-8 text-center">
                <div className="animate-spin mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Processing in Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we extract tables from your PDF...
                </p>
              </Card>
            )}

            {selectedJobData.status === 'failed' && (
              <Card className="p-8 text-center border-destructive">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing Failed</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedJobData.errorMessage || 'An error occurred while processing your PDF.'}
                </p>
                <Button 
                  onClick={() => onReprocess(selectedJobData.id)}
                  data-testid={`button-reprocess-failed-${selectedJobData.id}`}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-8 text-center h-96 flex items-center justify-center">
            <div>
              <DownloadCloud className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a Job</h3>
              <p className="text-sm text-muted-foreground">
                Choose a processing job from the list to view details and download results
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}