import { useState } from "react";
import { Download, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import type { ExtractedTable } from "@shared/schema";

interface TablesResponse {
  success: boolean;
  data: ExtractedTable[];
}

export function TablePreview() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedTableIndex, setSelectedTableIndex] = useState<number>(0);

  // This would typically come from a job selection mechanism
  // For now, we'll use a placeholder or the first available job
  const { data: tablesResponse } = useQuery<TablesResponse>({
    queryKey: ['/api/jobs', selectedJobId, 'tables'],
    enabled: !!selectedJobId,
  });

  const tables = tablesResponse?.data || [];
  const selectedTable = tables[selectedTableIndex];

  if (!selectedJobId) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Extracted Tables Preview</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Select a completed job to preview extracted tables.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tables.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Extracted Tables Preview</h2>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No tables found for the selected job.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Extracted Tables Preview</h2>
          <div className="flex items-center space-x-2">
            <Select 
              value={selectedTableIndex.toString()} 
              onValueChange={(value) => setSelectedTableIndex(parseInt(value))}
            >
              <SelectTrigger className="w-64" data-testid="select-table">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table, index) => (
                  <SelectItem key={table.id} value={index.toString()}>
                    Table {table.tableIndex + 1} - {table.data.length} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground" 
              size="sm"
              data-testid="button-export-table"
            >
              <Download className="w-4 h-4 mr-1" />
              Export This Table
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {selectedTable && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="font-medium">Table {selectedTable.tableIndex + 1}:</span>
                  <span className="text-muted-foreground ml-1">
                    {selectedTable.headers?.length || 0} columns × {selectedTable.data.length} rows
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Confidence:</span>
                  <span className="text-green-600 ml-1" data-testid={`confidence-${selectedTable.id}`}>
                    {selectedTable.confidence || 0}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  {selectedTable.headers && selectedTable.headers.length > 0 && (
                    <TableHeader>
                      <TableRow className="bg-muted">
                        {selectedTable.headers.map((header, index) => (
                          <TableHead 
                            key={index} 
                            className="px-4 py-3 text-left text-sm font-medium"
                            data-testid={`header-${index}`}
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                  )}
                  <TableBody>
                    {selectedTable.data.slice(0, 10).map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex} 
                        className="hover:bg-muted/50 transition-colors"
                        data-testid={`row-${rowIndex}`}
                      >
                        {row.map((cell, cellIndex) => (
                          <TableCell 
                            key={cellIndex} 
                            className="px-4 py-3 text-sm table-cell"
                            data-testid={`cell-${rowIndex}-${cellIndex}`}
                          >
                            {cell || ''}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {Math.min(10, selectedTable.data.length)} of {selectedTable.data.length} rows
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  data-testid="button-view-all-rows"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View All Rows
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                  size="sm"
                  data-testid="button-edit-data"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Data
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
