import { CheckCircle, Clock, AlertCircle, FileText, Eye, Download, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { ProcessingStatus } from '@shared/schema'

interface ProcessingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'active' | 'completed' | 'error'
}

interface ProcessingPipelineProps {
  status: ProcessingStatus
  fileName?: string
  estimatedTime?: number
}

export function ProcessingPipeline({ status, fileName, estimatedTime }: ProcessingPipelineProps) {
  const steps: ProcessingStep[] = [
    {
      id: 'upload',
      title: 'File Upload',
      description: 'PDF file uploaded successfully',
      icon: FileText,
      status: getStepStatus('upload', status.step)
    },
    {
      id: 'ocr',
      title: 'OCR Processing',
      description: 'Extracting text from scanned pages',
      icon: Eye,
      status: getStepStatus('ocr', status.step)
    },
    {
      id: 'table-detection',
      title: 'Table Detection',
      description: 'Identifying and analyzing table structures',
      icon: Zap,
      status: getStepStatus('table-detection', status.step)
    },
    {
      id: 'excel-generation',
      title: 'Excel Generation',
      description: 'Creating formatted Excel files',
      icon: Download,
      status: getStepStatus('excel-generation', status.step)
    }
  ]

  function getStepStatus(stepId: string, currentStep: string): 'pending' | 'active' | 'completed' | 'error' {
    const stepOrder = ['upload', 'ocr', 'table-detection', 'excel-generation', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(stepId)
    
    if (stepIndex < currentIndex || currentStep === 'complete') return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  const getIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return CheckCircle
      case 'error':
        return AlertCircle
      case 'active':
        return step.icon
      default:
        return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'active':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'active':
        return <Badge>Processing</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  return (
    <Card className="p-6" data-testid="processing-pipeline">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Processing Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              {fileName && `Processing: ${fileName}`}
            </p>
          </div>
          {estimatedTime && (
            <div className="text-right">
              <p className="text-sm font-medium">Estimated Time</p>
              <p className="text-xs text-muted-foreground">{estimatedTime} seconds</p>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-2" data-testid="progress-overall" />
          <p className="text-xs text-muted-foreground mt-1">{status.message}</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = getIcon(step)
            return (
              <div key={step.id} className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'active' ? 'bg-primary/10' :
                  step.status === 'error' ? 'bg-red-100' :
                  'bg-muted'
                }`}>
                  <Icon className={`h-4 w-4 ${getStatusColor(step.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">{step.title}</h4>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  
                  {step.status === 'active' && (
                    <div className="mt-2">
                      <Progress value={status.progress} className="h-1" />
                    </div>
                  )}
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`absolute left-4 mt-8 w-px h-6 ${
                    step.status === 'completed' ? 'bg-green-200' : 'bg-muted'
                  }`} style={{ marginLeft: '15px' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}