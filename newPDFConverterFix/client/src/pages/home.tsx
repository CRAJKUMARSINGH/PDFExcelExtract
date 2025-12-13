import { FileText, Settings, HelpCircle } from "lucide-react";
import { UploadSection } from "@/components/upload-section";
import { BatchProcessingSection } from "@/components/batch-processing";
import { ProcessingJobs } from "@/components/processing-jobs";
import { TablePreview } from "@/components/table-preview";
import { DebugPanel } from "@/components/debug-panel";

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PDF Excel Extract</h1>
                <p className="text-sm text-muted-foreground">Professional PDF to Excel Converter</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                data-testid="button-help"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="text-lg" />
              </button>
              <button 
                data-testid="button-settings"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <UploadSection />
        <BatchProcessingSection />
        <ProcessingJobs />
        <TablePreview />
        <DebugPanel />
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>&copy; 2024 PDF Excel Extract. Built with precision for document processing.</p>
            <div className="flex items-center space-x-4">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">API Reference</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
