import { FileText, FileSpreadsheet, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ResultFile {
  id: string;
  name: string;
  originalName: string;
  type: "excel" | "word";
  size: string;
  date: string;
  conversionId?: string;
}

interface ResultsListProps {
  results: ResultFile[];
}

export function ResultsList({ results }: ResultsListProps) {
  const { toast } = useToast();

  if (results.length === 0) return null;

  const handleDownload = async (file: ResultFile) => {
    try {
      if (!file.conversionId) {
        throw new Error("Conversion ID missing");
      }

      const response = await fetch(`/api/download/${file.conversionId}/${file.type}`);
      
      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${file.name}...`,
      });

    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Could not download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = () => {
    results.forEach((file, index) => {
      setTimeout(() => {
        handleDownload(file);
      }, index * 1000);
    });
    
    toast({
      title: "Batch Download Started",
      description: `Downloading ${results.length} files...`,
    });
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Output Files</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs"
          onClick={handleDownloadAll}
        >
          <Download className="mr-2 h-3.5 w-3.5" />
          Download All
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {results.map((file) => (
          <Card
            key={file.id}
            className="flex items-center justify-between p-4 hover:shadow-md transition-shadow duration-200 border-border/60"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                {file.type === "excel" ? (
                  <FileSpreadsheet className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm text-foreground">
                  {file.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    From: {file.originalName}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground">
                    {file.size}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                <CheckCircle className="mr-1 h-3 w-3" />
                Converted
              </Badge>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => handleDownload(file)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

