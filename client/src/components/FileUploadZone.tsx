import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface UploadedFile {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  id: string
}

interface FileUploadZoneProps {
  onFilesUploaded: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
}

export function FileUploadZone({ 
  onFilesUploaded, 
  maxFiles = 10, 
  maxSize = 50 * 1024 * 1024, // 50MB
  disabled = false 
}: FileUploadZoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substr(2, 9)
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((uploadFile, index) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        )
      }, 200)

      setTimeout(() => {
        clearInterval(interval)
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress: 100, status: 'completed' as const }
              : f
          )
        )
        
        // Call the callback after a short delay to show completion
        setTimeout(() => {
          onFilesUploaded(acceptedFiles)
        }, 500)
      }, 2000 + index * 500) // Stagger completion times
    })
  }, [onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize,
    disabled: disabled || uploadedFiles.some(f => f.status === 'uploading')
  })

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <Card 
        {...getRootProps()} 
        className={`
          p-8 border-2 border-dashed cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover-elevate'}
        `}
        data-testid="file-upload-zone"
      >
        <input {...getInputProps()} data-testid="file-input" />
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragActive ? 'Drop your PDF files here' : 'Upload PDF Files'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your scanned PDF files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum {maxFiles} files, {formatFileSize(maxSize)} each
            </p>
          </div>
          {!disabled && (
            <Button variant="outline" data-testid="button-browse-files">
              Browse Files
            </Button>
          )}
        </div>
      </Card>

      {fileRejections.length > 0 && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <h4 className="text-sm font-medium text-destructive mb-2">Upload Errors:</h4>
          <ul className="text-xs text-destructive space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map(e => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((uploadFile) => (
            <Card key={uploadFile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`file-name-${uploadFile.id}`}>
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={uploadFile.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploading... {uploadFile.progress}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeFile(uploadFile.id)}
                    data-testid={`button-remove-${uploadFile.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}