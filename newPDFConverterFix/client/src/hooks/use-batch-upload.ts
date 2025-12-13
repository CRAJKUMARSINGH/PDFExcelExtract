import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadOptions {
  ocr?: boolean;
  extractTables?: boolean;
}

interface BatchUploadResponse {
  success: boolean;
  data: {
    jobs: Array<{
      jobId: string;
      filename: string;
      status: string;
      uploadedAt: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
    errors: Array<{
      filename: string;
      error: string;
    }>;
  };
}

export function useBatchUpload() {
  const queryClient = useQueryClient();

  const batchUploadMutation = useMutation({
    mutationFn: async ({ files, options }: { files: File[]; options: UploadOptions }) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('options', JSON.stringify(options));
      const response = await apiRequest('POST', '/api/jobs/batch', formData);
      return response.json() as Promise<BatchUploadResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  const sampleFolderMutation = useMutation({
    mutationFn: async (options: UploadOptions) => {
      const response = await apiRequest('POST', '/api/jobs/sample-folder', {
        options: JSON.stringify(options)
      });
      return response.json() as Promise<BatchUploadResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  return {
    uploadFiles: (files: File[], options: UploadOptions = {}) => 
      batchUploadMutation.mutateAsync({ files, options }),
    processSampleFolder: (options: UploadOptions = {}) =>
      sampleFolderMutation.mutateAsync(options),
    isUploading: batchUploadMutation.isPending,
    isProcessingSamples: sampleFolderMutation.isPending,
    error: batchUploadMutation.error || sampleFolderMutation.error,
  };
}