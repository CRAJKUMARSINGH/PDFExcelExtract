import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileType } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUploader({ onFilesSelected, disabled }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out cursor-pointer group",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="relative bg-background p-4 rounded-full shadow-sm ring-1 ring-border group-hover:ring-primary/50 transition-all">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isDragActive ? "Drop PDF files here" : "Drag & drop PDF files"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Support for scanned documents, native PDFs, and bulk processing. 
          Standard and OCR modes available.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border border-border">
          <FileType className="h-3 w-3" />
          <span>Supports .PDF</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>Max 50MB</span>
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
    </div>
  );
}

