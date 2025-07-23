'use client'

import { Download } from 'lucide-react'
import { useCallback } from 'react'

interface ExportCSVButtonProps {
  data: Record<string, any>[]
  fileName?: string
  className?: string
}

function csvEscape(value: any): string {
  if (value === null || value === undefined) return ''
  const stringified = String(value)
  if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
    return `"${stringified.replace(/"/g, '""')}"`
  }
  return stringified
}

function flattenObject(obj: Record<string, any>, parentKey = '', result: Record<string, any> = {}): Record<string, any> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, newKey, result)
    } else {
      result[newKey] = value
    }
  }
  return result
}

export default function ExportCSVButton({ data = [], fileName = 'data.csv', className = '' }: ExportCSVButtonProps) {
  const handleExport = useCallback(() => {
    try {
      if (!data || data.length === 0) {
        alert('Aucune donnée à exporter.')
        return
      }

      const flattenedData = data.map(d => flattenObject(d))
      const headers = Array.from(new Set(flattenedData.flatMap(Object.keys)))

      const csvRows: string[] = []
      csvRows.push(headers.join(','))
      
      for (const row of flattenedData) {
        const values = headers.map(h => csvEscape(row[h] ?? ''))
        csvRows.push(values.join(','))
      }

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Erreur lors de l\'export CSV')
    }
  }, [data, fileName])

  return (
    <button
      type="button"
      onClick={handleExport}
      className={`inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
    >
      <Download className="w-5 h-5 mr-2" />
      Export CSV ({data?.length || 0})
    </button>
  )
} 