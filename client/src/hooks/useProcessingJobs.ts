import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ProcessingJob, ExtractedTable, ProcessingStatus } from '@shared/schema';

export interface JobWithTables extends ProcessingJob {
  tables: ExtractedTable[];
}

export function useProcessingJobs() {
  const queryClient = useQueryClient();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  // Query to fetch all jobs
  const { data: jobs = [], isLoading, refetch } = useQuery<JobWithTables[]>({
    queryKey: ['/api/jobs'],
    refetchInterval: currentJobId && currentJob?.status === 'processing' ? 2000 : false, // Poll only when processing
  });

  // Mutation to upload PDF files
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('pdf', file);
        
        const response = await apiRequest('POST', '/api/jobs/upload', formData);
        return response.json() as Promise<{ id: string; message: string }>;
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: (results) => {
      // Set the first uploaded job as current
      if (results.length > 0) {
        setCurrentJobId(results[0].id);
      }
      
      // Refetch jobs list
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  // Mutation to start processing a job
  const startProcessingMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/process`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  // Mutation to retry/reprocess a job
  const retryJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('POST', `/api/jobs/${jobId}/reprocess`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  // Mutation to delete a job
  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('DELETE', `/api/jobs/${jobId}`);
      return response.json();
    },
    onSuccess: (_, deletedJobId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      if (currentJobId === deletedJobId) {
        setCurrentJobId(null);
      }
    },
  });

  // Get current job details
  const currentJob = jobs.find(job => job.id === currentJobId);

  // Update processing status based on current job
  useEffect(() => {
    if (currentJob) {
      let step: ProcessingStatus['step'] = 'upload';
      let message = 'Initializing...';

      switch (currentJob.status) {
        case 'pending':
          step = 'upload';
          message = 'File uploaded, waiting to start processing...';
          break;
        case 'processing':
          const progress = currentJob.progress || 0;
          if (progress < 30) {
            step = 'ocr';
            message = 'Performing OCR on scanned pages...';
          } else if (progress < 70) {
            step = 'table-detection';
            message = 'Detecting and analyzing table structures...';
          } else if (progress < 95) {
            step = 'excel-generation';
            message = 'Generating Excel files...';
          } else {
            step = 'complete';
            message = 'Finalizing processing...';
          }
          break;
        case 'completed':
          step = 'complete';
          message = 'Processing completed successfully!';
          break;
        case 'failed':
          step = 'upload';
          message = currentJob.errorMessage || 'Processing failed. Please try again.';
          break;
      }

      setProcessingStatus({
        step,
        progress: currentJob.progress || 0,
        message,
      });
    } else {
      setProcessingStatus(null);
    }
  }, [currentJob]);

  // Upload and start processing
  const handleFilesUploaded = useCallback(async (files: File[]) => {
    try {
      const results = await uploadMutation.mutateAsync(files);
      
      // Start processing the first uploaded file
      if (results.length > 0) {
        await startProcessingMutation.mutateAsync(results[0].id);
      }
    } catch (error) {
      console.error('Failed to upload and process files:', error);
    }
  }, [uploadMutation, startProcessingMutation]);

  // Download Excel file for a specific table
  const downloadTableExcel = useCallback(async (jobId: string, tableId: string, filename: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/tables/${tableId}/excel`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_table_${tableId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download table Excel:', error);
    }
  }, []);

  // Download combined Excel file for all tables
  const downloadAllTablesExcel = useCallback(async (jobId: string, filename: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/excel`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_all_tables.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download combined Excel:', error);
    }
  }, []);

  return {
    jobs,
    currentJob,
    currentJobId,
    setCurrentJobId,
    processingStatus,
    isLoading,
    handleFilesUploaded,
    retryJob: retryJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
    downloadTableExcel,
    downloadAllTablesExcel,
    refetch,
    isUploading: uploadMutation.isPending,
    isProcessing: startProcessingMutation.isPending,
  };
}