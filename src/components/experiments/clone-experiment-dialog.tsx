'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Experiment, ExperimentScreenshot, DeviceType, InputMode } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Copy, Loader2 } from 'lucide-react'

interface CloneExperimentDialogProps {
  experiment: Experiment
  children?: React.ReactNode
}

export function CloneExperimentDialog({ experiment, children }: CloneExperimentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(`${experiment.name} (Copy)`)
  const [isLoading, setIsLoading] = useState(false)
  const [personaIds, setPersonaIds] = useState<string[]>([])
  const [runsPerPersona, setRunsPerPersona] = useState(3)

  // Fetch experiment personas when dialog opens
  useEffect(() => {
    if (open) {
      const fetchPersonas = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('experiment_personas')
          .select('persona_id, runs_count')
          .eq('experiment_id', experiment.id)

        if (data && data.length > 0) {
          setPersonaIds(data.map((ep) => ep.persona_id))
          setRunsPerPersona(data[0].runs_count || 3)
        }
      }
      fetchPersonas()
    }
  }, [open, experiment.id])

  const handleClone = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name')
      return
    }

    setIsLoading(true)

    try {
      // Parse input links
      const inputLinks = experiment.input_links as { control?: string; variant?: string; single?: string } || {}
      const screenshots = (experiment.screenshots as unknown as ExperimentScreenshot[]) || []

      const cloneData = {
        name: name.trim(),
        projectId: experiment.project_id,
        type: experiment.type,
        inputMode: (experiment.input_mode || 'live_url') as InputMode,
        controlUrl: inputLinks.single || inputLinks.control || '',
        variantUrl: inputLinks.variant || '',
        screenshots,
        hypothesis: experiment.hypothesis || '',
        deviceTargets: (experiment.device_targets || ['desktop']) as DeviceType[],
        script: experiment.script || '',
        selectedPersonaIds: personaIds,
        runsPerPersona,
      }

      console.log('[CloneDialog] Saving clone data:', cloneData.name)

      // Save directly to sessionStorage before calling store
      const storageKey = 'heuristiq-wizard-clone-data'
      const dataToSave = { ...cloneData, isClone: true }
      sessionStorage.setItem(storageKey, JSON.stringify(dataToSave))
      
      // Verify the save
      const saved = sessionStorage.getItem(storageKey)
      console.log('[CloneDialog] Verified sessionStorage:', saved ? JSON.parse(saved).name : 'FAILED')

      if (!saved) {
        throw new Error('Failed to save clone data to sessionStorage')
      }

      toast.success('Opening experiment wizard with cloned data...')
      setOpen(false)
      
      // Navigate after ensuring data is saved
      router.push('/experiments/new')
    } catch (error) {
      console.error('Clone error:', error)
      toast.error('Failed to prepare clone')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Experiment</DialogTitle>
          <DialogDescription>
            Create a new experiment based on &quot;{experiment.name}&quot;. You&apos;ll be taken to 
            the experiment wizard to review and modify the settings before launching.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="clone-name">New Experiment Name</Label>
            <Input
              id="clone-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for the cloned experiment"
              autoFocus
            />
          </div>

          {/* Clone Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <p className="font-medium text-muted-foreground">What will be copied:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Experiment type ({experiment.type === 'usability' ? 'Usability Experiment' : 'A/B Experiment'})</li>
              <li>
                {experiment.input_mode === 'screenshots' 
                  ? `${((experiment.screenshots as unknown as ExperimentScreenshot[]) || []).length} screenshots with context`
                  : 'Target URLs'
                }
              </li>
              <li>Research script & hypothesis</li>
              <li>Device targets ({experiment.device_targets?.join(', ') || 'desktop'})</li>
              <li>Selected personas ({personaIds.length})</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
              💡 You&apos;ll be able to <strong>review and edit</strong> all settings in the wizard before launching.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={isLoading || !name.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Clone & Edit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
