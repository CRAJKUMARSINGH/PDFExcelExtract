import { FileUploadZone } from '../FileUploadZone'

export default function FileUploadZoneExample() {
  return (
    <FileUploadZone
      onFilesUploaded={(files) => {
        console.log('Files uploaded:', files.map(f => f.name))
      }}
      maxFiles={5}
      maxSize={50 * 1024 * 1024} // 50MB
    />
  )
}