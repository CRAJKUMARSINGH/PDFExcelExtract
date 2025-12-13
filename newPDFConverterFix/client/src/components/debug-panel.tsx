import { useState } from "react";
import { Bug, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface DebugInfo {
  job: {
    id: string;
    filename: string;
    status: string;
    progress: number;
    errorMessage?: string;
  };
  tables: {
    count: number;
    structures: Array<{
      index: number;
      headers: number;
      rows: number;
      confidence: number;
      dataValid: boolean;
    }>;
  };
  excelFile: {
    exists: boolean;
    size: number;
    mimeType: string;
  };
  validation: {
    xlsxLibraryLoaded: boolean;
    dataStructureValid: boolean;
    bufferGenerationReady: boolean;
  };
  error?: string;
}

interface DebugResponse {
  success: boolean;
  data: DebugInfo;
}

export function DebugPanel() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

  const { data: debugResponse, refetch } = useQuery<DebugResponse>({
    queryKey: ['/api/jobs', selectedJobId, 'debug'],
    enabled: !!selectedJobId && showDebug,
  });

  const debugInfo = debugResponse?.data;

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusClass = (status: boolean) => {
    return status ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";
  };

  const getStatusTextClass = (status: boolean) => {
    return status ? "text-green-800" : "text-red-800";
  };

  if (!showDebug) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Excel Generation Debug</h2>
            <Button 
              variant="secondary"
              onClick={() => setShowDebug(true)}
              data-testid="button-show-debug"
            >
              <Bug className="w-4 h-4 mr-1" />
              Show Debug Panel
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Excel Generation Debug</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary"
              onClick={() => refetch()}
              disabled={!selectedJobId}
              data-testid="button-run-validation"
            >
              <Bug className="w-4 h-4 mr-1" />
              Run Validation
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowDebug(false)}
              data-testid="button-hide-debug"
            >
              Hide
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {!selectedJobId ? (
          <div className="text-center py-8 text-muted-foreground">
            Select a job ID to run debug validation.
            <div className="mt-4">
              <input 
                type="text" 
                placeholder="Enter Job ID" 
                className="px-3 py-2 border rounded"
                onChange={(e) => setSelectedJobId(e.target.value)}
                data-testid="input-job-id"
              />
            </div>
          </div>
        ) : debugInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Buffer Creation Status</h3>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 border rounded ${getStatusClass(debugInfo.validation.xlsxLibraryLoaded)}`}>
                    <span className={`text-sm ${getStatusTextClass(debugInfo.validation.xlsxLibraryLoaded)}`}>
                      XLSX Library Loaded
                    </span>
                    {getStatusIcon(debugInfo.validation.xlsxLibraryLoaded)}
                  </div>
                  <div className={`flex items-center justify-between p-3 border rounded ${getStatusClass(debugInfo.validation.dataStructureValid)}`}>
                    <span className={`text-sm ${getStatusTextClass(debugInfo.validation.dataStructureValid)}`}>
                      Data Structure Valid
                    </span>
                    {getStatusIcon(debugInfo.validation.dataStructureValid)}
                  </div>
                  <div className={`flex items-center justify-between p-3 border rounded ${getStatusClass(debugInfo.validation.bufferGenerationReady)}`}>
                    <span className={`text-sm ${getStatusTextClass(debugInfo.validation.bufferGenerationReady)}`}>
                      Buffer Generation Ready
                    </span>
                    {getStatusIcon(debugInfo.validation.bufferGenerationReady)}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">MIME Type Handling</h3>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 border rounded ${debugInfo.excelFile.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <span className="text-sm">Current MIME Type</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border" data-testid="text-current-mime">
                      {debugInfo.excelFile.mimeType}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm text-green-800">Expected XLSX MIME</span>
                    <code className="text-xs bg-green-100 px-2 py-1 rounded" data-testid="text-expected-mime">
                      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Job Information</h3>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-2" data-testid="text-job-status">{debugInfo.job.status}</span>
                  </div>
                  <div>
                    <span className="font-medium">Progress:</span>
                    <span className="ml-2" data-testid="text-job-progress">{debugInfo.job.progress}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Tables:</span>
                    <span className="ml-2" data-testid="text-tables-count">{debugInfo.tables.count}</span>
                  </div>
                  <div>
                    <span className="font-medium">Excel File:</span>
                    <span className="ml-2" data-testid="text-excel-exists">
                      {debugInfo.excelFile.exists ? `${Math.round(debugInfo.excelFile.size / 1024)} KB` : 'Not generated'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {debugInfo.error && (
              <div>
                <h3 className="font-medium mb-3">Error Details</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="text-red-600 mt-1 w-5 h-5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Debug Validation Error</p>
                      <p className="text-sm text-red-700 mt-1" data-testid="text-debug-error">
                        {debugInfo.error}
                      </p>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-red-800">Troubleshooting Steps:</p>
                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                          <li>• Verify job exists and has completed processing</li>
                          <li>• Check if tables were extracted successfully</li>
                          <li>• Ensure Excel generation service is running</li>
                          <li>• Validate table data structure integrity</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-3">Table Structure Validation</h3>
              <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm">
                <div className="text-muted-foreground">// Table structures detected</div>
                <pre className="text-foreground mt-2" data-testid="text-table-structures">
{JSON.stringify({
  tablesCount: debugInfo.tables.count,
  structures: debugInfo.tables.structures.map(table => ({
    tableIndex: table.index,
    headers: table.headers,
    rows: table.rows,
    confidence: table.confidence,
    dataValid: table.dataValid
  }))
}, null, 2)}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Loading debug information...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
