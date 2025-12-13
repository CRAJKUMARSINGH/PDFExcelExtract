import { useState } from "react";
import { FolderOpen, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBatchProcessing } from "@/hooks/use-batch-processing";

export function BatchProcessingSection() {
  const { toast } = useToast();
  const { startBatchProcessing, isProcessing } = useBatchProcessing();
  const [folderPath, setFolderPath] = useState("Sample_input_files");
  const [options, setOptions] = useState({
    ocr: false,
    extractTables: true
  });

  const handleBatchProcess = async () => {
    try {
      const result = await startBatchProcessing(folderPath, options);
      
      toast({
        title: "Batch Processing Started",
        description: `${result.data.totalFiles} files queued for processing. Check the processing jobs section for updates.`,
      });
    } catch (error) {
      // Error handling is silent as per user request
      console.log('Batch processing error:', error);
    }
  };

  const handleQuickProcess = () => {
    setFolderPath("Sample_input_files");
    handleBatchProcess();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Batch Processing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-path">Folder Path</Label>
            <Input
              id="folder-path"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="Enter folder path (e.g., Sample_input_files)"
              disabled={isProcessing}
            />
            <p className="text-sm text-muted-foreground">
              Path relative to project root. Will process all PDF files in the folder.
            </p>
          </div>

          <div className="space-y-4">
            <Label>Processing Options</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ocr-switch" className="text-sm font-normal">
                  OCR Processing
                </Label>
                <p className="text-xs text-muted-foreground">
                  Extract text from scanned documents
                </p>
              </div>
              <Switch
                id="ocr-switch"
                checked={options.ocr}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, ocr: checked }))
                }
                disabled={isProcessing}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tables-switch" className="text-sm font-normal">
                  Extract Tables
                </Label>
                <p className="text-xs text-muted-foreground">
                  Identify and extract table data
                </p>
              </div>
              <Switch
                id="tables-switch"
                checked={options.extractTables}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({ ...prev, extractTables: checked }))
                }
                disabled={isProcessing}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleQuickProcess}
            disabled={isProcessing}
            className="flex-1"
            variant="default"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Quick Process Sample Files
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleBatchProcess}
            disabled={isProcessing || !folderPath.trim()}
            variant="outline"
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FolderOpen className="w-4 h-4 mr-2" />
                Process Custom Folder
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Sample Files Available</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div>• BILL_SCRUTINY_SHEET.pdf</div>
            <div>• MPR August 2025-1.pdf</div>
            <div>• rpwa1-1.pdf</div>
            <div>• rpwa1-2.pdf</div>
            <div>• rpwa1-3.pdf</div>
            <div>• rpwa1-4.pdf</div>
            <div>• rpwa1-5.pdf</div>
            <div>• rpwa1-6.pdf</div>
            <div>• rpwa1.pdf</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}