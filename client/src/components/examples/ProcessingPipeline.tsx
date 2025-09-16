import { ProcessingPipeline } from '../ProcessingPipeline'

export default function ProcessingPipelineExample() {
  return (
    <ProcessingPipeline
      status={{
        step: 'table-detection',
        progress: 65,
        message: 'Analyzing table structures and extracting data...'
      }}
      fileName="monthly-report-august-2025.pdf"
      estimatedTime={45}
    />
  )
}