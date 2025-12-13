import { FileText, RefreshCw, Filter, CheckCircle, Clock, XCircle, Download, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProcessingJob } from "@shared/schema";

interface ListJobsResponse {
  success: boolean;
  data: ProcessingJob[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function ProcessingJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobsResponse, isLoading, refetch } = useQuery<ListJobsResponse>({
    queryKey: ['/api/jobs'],
    refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
  });

  const downloadMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('GET', `/api/jobs/${jobId}/download`);
      const blob = new Blob([await response.arrayBuffer()], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export_${jobId}.xlsx`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return filename;
    },
    onSuccess: (filename) => {
      toast({
        title: "Download started",
        description: `Excel file ${filename} is being downloaded.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download Excel file",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return (
          <div className="flex items-center space-x-1 text-blue-500">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse-dot"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-pulse-dot"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-pulse-dot"></div>
          </div>
        );
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'completed': return 'status-completed';
      case 'failed': return 'status-failed';
      default: return 'text-gray-500';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-primary';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const uploadDate = new Date(date);
    const diffMs = now.getTime() - uploadDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Processing Jobs</h2>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading jobs...
          </div>
        </CardContent>
      </Card>
    );
  }

  const jobs = jobsResponse?.data || [];

  if (jobs.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Processing Jobs</h2>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()}
                data-testid="button-refresh-jobs"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                data-testid="button-filter-jobs"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No processing jobs found. Upload a PDF file to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Processing Jobs</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-refresh-jobs"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              data-testid="button-filter-jobs"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="divide-y divide-border">
        {jobs.map((job) => (
          <div key={job.id} className="p-6" data-testid={`job-${job.id}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                  <FileText className="text-destructive text-lg" />
                </div>
                <div>
                  <h3 className="font-medium" data-testid={`text-filename-${job.id}`}>
                    {job.filename}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {job.status === 'completed' && job.completedAt 
                      ? `Completed ${formatTimeAgo(job.completedAt.toString())}`
                      : `Uploaded ${formatTimeAgo(job.uploadedAt.toString())}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`flex items-center space-x-2 ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)}
                  <span className="capitalize" data-testid={`status-${job.id}`}>
                    {job.status}
                  </span>
                </span>
              </div>
            </div>
            
            {job.status === 'processing' && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Processing...</span>
                  <span data-testid={`progress-${job.id}`}>{job.progress || 0}%</span>
                </div>
                <Progress value={job.progress || 0} className="h-2" />
              </div>
            )}

            {job.status === 'failed' && job.errorMessage && (
              <div className="mb-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">Processing Failed</p>
                  <p className="text-sm text-destructive/80" data-testid={`error-${job.id}`}>
                    {job.errorMessage}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {job.status === 'completed' && 'Tables extracted successfully'}
                {job.status === 'processing' && 'Extracting tables...'}
                {job.status === 'pending' && 'Waiting to process...'}
                {job.status === 'failed' && 'Processing failed'}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  data-testid={`button-preview-${job.id}`}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                {job.status === 'completed' ? (
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    size="sm"
                    onClick={() => downloadMutation.mutate(job.id)}
                    disabled={downloadMutation.isPending}
                    data-testid={`button-download-${job.id}`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {downloadMutation.isPending ? 'Downloading...' : 'Download Excel'}
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled
                    data-testid={`button-download-${job.id}`}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Excel
                  </Button>
                )}
                {job.status === 'failed' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    data-testid={`button-remove-${job.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
