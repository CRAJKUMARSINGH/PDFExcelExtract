import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BatchProcessOptions {
  ocr?: boolean;
  extractTables?: boolean;
}

interface BatchProcessRequest {
  folderPath: string;
  options?: BatchProcessOptions;
}

interface BatchProcessResponse {
  success: boolean;
  data: {
    message: string;
    totalFiles: number;
    processedFiles: Array<{
      filename: string;
      jobId: string;
      status: string;
    }>;
    jobIds: string[];
  };
}

export function useBatchProcessing() {
  const queryClient = useQueryClient();

  const batchProcessMutation = useMutation({
    mutationFn: async ({ folderPath, options }: BatchProcessRequest) => {
      const response = await apiRequest('POST', '/api/batch-process', {
        folderPath,
        options: options || { ocr: false, extractTables: true }
      });
      return response.json() as Promise<BatchProcessResponse>;
    },
    onSuccess: () => {
      // Invalidate jobs list to refresh the UI with new batch jobs
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  return {
    startBatchProcessing: (folderPath: string, options: BatchProcessOptions = {}) => 
      batchProcessMutation.mutateAsync({ folderPath, options }),
    isProcessing: batchProcessMutation.isPending,
    error: batchProcessMutation.error,
  };
}