import { useState } from 'react'
import { Download, Edit3, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { TablePreview as TablePreviewType } from '@shared/schema'

interface TablePreviewProps {
  table: TablePreviewType
  onDownload: (tableId: string, format: 'xlsx' | 'csv') => void
  onEdit?: (tableId: string, data: string[][]) => void
  editable?: boolean
}

export function TablePreview({ table, onDownload, onEdit, editable = true }: TablePreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<string[][]>(table.data)
  const [showPreview, setShowPreview] = useState(true)
  const [copiedCell, setCopiedCell] = useState<string | null>(null)

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...editedData]
    newData[rowIndex] = [...newData[rowIndex]]
    newData[rowIndex][colIndex] = value
    setEditedData(newData)
  }

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(table.id, editedData)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedData(table.data)
    setIsEditing(false)
  }

  const copyToClipboard = (text: string, cellId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCell(cellId)
    setTimeout(() => setCopiedCell(null), 2000)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-700'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const dataToDisplay = isEditing ? editedData : table.data

  return (
    <Card className="overflow-hidden" data-testid={`table-preview-${table.id}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold">Table {table.id.slice(-4)}</h3>
              <Badge className={getConfidenceColor(table.confidence)}>
                {table.confidence}% confidence
              </Badge>
              {isEditing && (
                <Badge variant="outline">Editing</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {table.rowCount} rows × {table.colCount} columns
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
              data-testid={`button-toggle-preview-${table.id}`}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            {editable && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                data-testid={`button-edit-${table.id}`}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            
            {isEditing ? (
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSaveEdit} data-testid={`button-save-${table.id}`}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} data-testid={`button-cancel-${table.id}`}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onDownload(table.id, 'xlsx')}
                  data-testid={`button-download-xlsx-${table.id}`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  XLSX
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownload(table.id, 'csv')}
                  data-testid={`button-download-csv-${table.id}`}
                >
                  CSV
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPreview && (
        <ScrollArea className="h-96">
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                {/* Headers */}
                {table.headers.length > 0 && (
                  <thead>
                    <tr>
                      {table.headers.map((header, colIndex) => (
                        <th
                          key={colIndex}
                          className="text-left p-2 border bg-muted font-medium text-sm"
                          data-testid={`header-${table.id}-${colIndex}`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                
                {/* Data rows */}
                <tbody>
                  {dataToDisplay.slice(0, 20).map((row, rowIndex) => ( // Show max 20 rows for preview
                    <tr key={rowIndex}>
                      {row.map((cell, colIndex) => {
                        const cellId = `${table.id}-${rowIndex}-${colIndex}`
                        return (
                          <td
                            key={colIndex}
                            className="p-2 border text-sm relative group"
                            data-testid={`cell-${cellId}`}
                          >
                            {isEditing ? (
                              <Input
                                value={cell}
                                onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                                className="h-8 text-xs"
                                data-testid={`input-${cellId}`}
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className="truncate max-w-32">{cell}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(cell, cellId)}
                                  data-testid={`button-copy-${cellId}`}
                                >
                                  {copiedCell === cellId ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {dataToDisplay.length > 20 && (
              <div className="mt-4 text-center">
                <Badge variant="outline">
                  Showing 20 of {dataToDisplay.length} rows
                </Badge>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
      
      {!showPreview && (
        <div className="p-8 text-center text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Preview hidden</p>
        </div>
      )}
    </Card>
  )
}