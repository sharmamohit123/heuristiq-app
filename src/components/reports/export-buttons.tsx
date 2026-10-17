'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import { generateMarkdownReport, downloadMarkdown, printToPDF } from '@/lib/export-utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonsProps {
  exportData: any
}

export function ExportButtons({ exportData }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleMarkdownExport = async () => {
    setIsExporting(true)
    try {
      const markdown = generateMarkdownReport(exportData)
      const filename = `${exportData.experiment.name.replace(/[^a-z0-9]/gi, '_')}_report_${new Date().getTime()}.md`
      
      // Note: Browser file downloads don't trigger blur/focus reliably like print dialogs do
      // The save dialog is browser UI, not a system modal, so events don't fire consistently
      // Best we can do is show "download started" immediately
      downloadMarkdown(markdown, filename)
      setIsExporting(false)
      
      // Show immediate feedback (browser will handle the actual save UI)
      toast.success('Markdown report ready!')
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export markdown report')
      setIsExporting(false)
    }
  }

  const handlePDFExport = () => {
    // Listen for when print dialog closes
    const handleAfterPrint = () => {
      // Show success message after print dialog closes
      toast.success('PDF report exported!')
      window.removeEventListener('afterprint', handleAfterPrint)
    }
    
    // Add event listener for when print/save completes
    window.addEventListener('afterprint', handleAfterPrint)
    
    // Open print dialog
    printToPDF()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePDFExport}>
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleMarkdownExport}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
