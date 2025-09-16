import { ResultsDashboard } from '../ResultsDashboard'

export default function ResultsDashboardExample() {
  // todo: remove mock functionality
  const mockJobs = [
    {
      id: 'job-001',
      filename: 'MPR August 2025-1.pdf',
      status: 'completed' as const,
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      progress: 100,
      tables: [
        {
          id: 'table-001',
          headers: ['Product', 'Revenue', 'Growth %', 'Market Share'],
          data: [
            ['Software Licenses', '$2,450,000', '12.5%', '28%'],
            ['Cloud Services', '$1,890,000', '25.3%', '22%'],
            ['Support Services', '$780,000', '8.2%', '15%'],
            ['Training', '$340,000', '15.7%', '12%']
          ],
          confidence: 96,
          rowCount: 4,
          colCount: 4
        },
        {
          id: 'table-002',
          headers: ['Region', 'Q1', 'Q2', 'Q3', 'Q4'],
          data: [
            ['North America', '$3.2M', '$3.5M', '$3.8M', '$4.1M'],
            ['Europe', '$2.1M', '$2.3M', '$2.6M', '$2.8M'],
            ['Asia Pacific', '$1.8M', '$2.0M', '$2.4M', '$2.7M'],
            ['Latin America', '$0.9M', '$1.1M', '$1.3M', '$1.5M']
          ],
          confidence: 89,
          rowCount: 4,
          colCount: 5
        }
      ]
    },
    {
      id: 'job-002',
      filename: 'financial-statements-q3.pdf',
      status: 'processing' as const,
      uploadedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      progress: 45,
      tables: []
    },
    {
      id: 'job-003',
      filename: 'inventory-report.pdf',
      status: 'failed' as const,
      uploadedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      progress: 0,
      tables: [],
      errorMessage: 'Unable to detect tables in the scanned document'
    }
  ]

  return (
    <ResultsDashboard
      jobs={mockJobs}
      onDownloadAll={(jobId) => {
        console.log('Download all tables for job:', jobId)
      }}
      onDownloadTable={(tableId, format) => {
        console.log(`Download ${format.toUpperCase()} for table:`, tableId)
      }}
      onReprocess={(jobId) => {
        console.log('Reprocess job:', jobId)
      }}
      onDelete={(jobId) => {
        console.log('Delete job:', jobId)
      }}
    />
  )
}