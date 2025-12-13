import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadOptions {
  ocr?: boolean;
  extractTables?: boolean;
}

interface UploadResponse {
  success: boolean;
  data: {
    jobId: string;
    filename: string;
    status: string;
    uploadedAt: string;
  };
}

export function useFileUpload() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, options }: { file: File; options: UploadOptions }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      formData.append('options', JSON.stringify(options));

      const response = await apiRequest('POST', '/api/jobs', formData);
      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: () => {
      // Invalidate jobs list to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });

  return {
    uploadFile: (file: File, options: UploadOptions = {}) => 
      uploadMutation.mutateAsync({ file, options }),
    isUploading: uploadMutation.isPending,
    error: uploadMutation.error,
  };
}
