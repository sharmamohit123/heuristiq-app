'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, Download, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ImportPersonasDialogProps {
  children?: React.ReactNode
  onImportComplete?: () => void
}

export function ImportPersonasDialog({ children, onImportComplete }: ImportPersonasDialogProps) {
  const [open, setOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const parseTSV = (content: string) => {
    const lines = content.trim().split('\n')
    const headers = lines[0].split('\t')
    
    return lines.slice(1).map(line => {
      const values = line.split('\t')
      const persona: any = {}
      
      headers.forEach((header, index) => {
        persona[header.trim()] = values[index]?.trim() || ''
      })
      
      return persona
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const content = await file.text()
      const personas = parseTSV(content)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Fetch existing personas to check for duplicates
      const { data: existingPersonas } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)

      let successCount = 0
      let skippedCount = 0
      
      for (const personaData of personas) {
        // Check if persona with same attributes already exists
        const isDuplicate = existingPersonas?.some(existing =>
          existing.name === personaData.name &&
          existing.device_type === personaData.device_type &&
          existing.experience_level === personaData.experience_level &&
          existing.patience_level === personaData.patience_level
        )

        if (isDuplicate) {
          skippedCount++
          continue  // Skip duplicate
        }

        // Generate avatar URL for consistency
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${personaData.name}&backgroundColor=5850ec,8b5cf6,ec4899&textColor=ffffff`

        const { error } = await supabase.from('personas').insert({
          user_id: user.id,
          name: personaData.name,
          description: personaData.description || null,
          device_type: personaData.device_type || 'desktop',
          experience_level: personaData.experience_level || 'intermediate',
          patience_level: personaData.patience_level || 'medium',
          avatar_url: avatarUrl,
        })

        if (!error) successCount++
      }

      if (skippedCount > 0) {
        toast.info(`Skipped ${skippedCount} duplicate ${skippedCount === 1 ? 'persona' : 'personas'}`)
      }

      setImportedCount(successCount)
      toast.success(`Successfully imported ${successCount} personas!`)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh the persona list immediately
      onImportComplete?.()

      // Close dialog
      setTimeout(() => {
        setOpen(false)
        setImportedCount(0)
      }, 1500)

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import personas. Please check the file format.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadSample = () => {
    // Download the sample TSV file
    const link = document.createElement('a')
    link.href = '/sample_personas.tsv'
    link.download = 'sample_personas.tsv'
    link.click()
    toast.success('Sample file downloaded!')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Personas from TSV</DialogTitle>
          <DialogDescription>
            Upload a TSV (Tab-Separated Values) file to bulk import personas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sample File Download */}
          <div className="p-4 bg-muted rounded-lg border">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Download Sample File</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Get a template TSV file with example personas to understand the format.
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                  <Download className="h-3 w-3 mr-2" />
                  Download sample_personas.tsv
                </Button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="p-4 border-2 border-dashed rounded-lg text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".tsv,.txt"
              onChange={handleFileUpload}
              className="hidden"
              id="tsv-upload"
            />
            <label
              htmlFor="tsv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Click to upload TSV file</p>
                <p className="text-xs text-muted-foreground">or drag and drop</p>
              </div>
            </label>
          </div>

          {/* Import Status */}
          {isImporting && (
            <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Importing personas...</span>
            </div>
          )}

          {importedCount > 0 && !isImporting && (
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                {importedCount} personas imported successfully!
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isImporting}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
