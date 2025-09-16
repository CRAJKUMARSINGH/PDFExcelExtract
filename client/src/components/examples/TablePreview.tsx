import { TablePreview } from '../TablePreview'

export default function TablePreviewExample() {
  const mockTable = {
    id: 'table-001',
    headers: ['Product', 'Price', 'Quantity', 'Total', 'Status'],
    data: [
      ['iPhone 15 Pro', '$999.00', '50', '$49,950.00', 'In Stock'],
      ['MacBook Air M2', '$1,199.00', '25', '$29,975.00', 'Low Stock'],
      ['iPad Pro 11"', '$799.00', '75', '$59,925.00', 'In Stock'],
      ['Apple Watch Series 9', '$399.00', '100', '$39,900.00', 'In Stock'],
      ['AirPods Pro 2', '$249.00', '200', '$49,800.00', 'In Stock'],
      ['Mac Studio', '$1,999.00', '10', '$19,990.00', 'Limited'],
      ['Studio Display', '$1,599.00', '15', '$23,985.00', 'In Stock']
    ],
    confidence: 94,
    rowCount: 7,
    colCount: 5
  }

  return (
    <TablePreview
      table={mockTable}
      onDownload={(tableId, format) => {
        console.log(`Download ${format.toUpperCase()} for table ${tableId}`)
      }}
      onEdit={(tableId, data) => {
        console.log(`Edit table ${tableId}`, data)
      }}
    />
  )
}