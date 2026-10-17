'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Project, ExperimentScreenshot } from '@/types/database'
import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { DRAFT_STORAGE_KEY } from '@/lib/open-draft'
import { WizardProgress } from '@/components/experiments/wizard-progress'
import { StepDetails } from '@/components/experiments/step-details'
import { StepScript } from '@/components/experiments/step-script'
import { StepPersonas } from '@/components/experiments/step-personas'
import { StepReview } from '@/components/experiments/step-review'
import { Button } from '@/components/ui/button'
import { X, Copy, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const steps = [
  { title: 'Details' },
  { title: 'Script' },
  { title: 'Personas' },
  { title: 'Review' },
]

export default function NewExperimentPage() {
  const searchParams = useSearchParams()
  const wizardState = useExperimentWizard()
  const { step, isClone, name, reset } = wizardState
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [cloneLoaded, setCloneLoaded] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  // Get URL params for pre-selection
  const typeParam = searchParams.get('type') as 'usability' | 'ab_test' | null
  const projectParam = searchParams.get('project')

  // Load clone or draft data from sessionStorage on mount - run only once
  // Use a ref to track if we've already loaded to prevent double-load in Strict Mode
  const hasLoadedRef = useRef(false)
  
  useEffect(() => {
    // Prevent double-loading in React Strict Mode
    if (hasLoadedRef.current) {
      setIsHydrated(true)
      return
    }
    hasLoadedRef.current = true
    
    // Check for draft data first (editing existing draft)
    const draftStorageKey = DRAFT_STORAGE_KEY
    const draftData = sessionStorage.getItem(draftStorageKey)
    
    if (draftData) {
      try {
        const data = JSON.parse(draftData)
        console.log('[NewExperimentPage] Loaded draft data:', data.name)
        
        // Clear sessionStorage to prevent re-loading on refresh
        sessionStorage.removeItem(draftStorageKey)
        
        // Set the draft ID so we update instead of create
        if (data.draftId) {
          setDraftId(data.draftId)
        }
        
        // Directly set the state in the store using zustand's setState API
        useExperimentWizard.setState({
          step: data.step || 1,
          name: data.name,
          projectId: data.projectId,
          type: data.type,
          inputMode: data.inputMode,
          controlUrl: data.controlUrl,
          variantUrl: data.variantUrl,
          screenshots: data.screenshots || [],
          hypothesis: data.hypothesis,
          deviceTargets: data.deviceTargets,
          script: data.script,
          selectedPersonaIds: data.selectedPersonaIds || [],
          runsPerPersona: data.runsPerPersona || 3,
          isClone: false, // Not a clone, it's a draft
        })
        
        console.log('[NewExperimentPage] Store updated with draft data')
        setCloneLoaded(true) // Reuse this flag to show the banner
        setIsHydrated(true)
        return
      } catch (e) {
        console.error('[NewExperimentPage] Error parsing draft data:', e)
      }
    }
    
    // Check for clone data (creating new from existing)
    const cloneStorageKey = 'heuristiq-wizard-clone-data'
    const cloneData = sessionStorage.getItem(cloneStorageKey)
    
    console.log('[NewExperimentPage] Checking clone sessionStorage:', cloneData ? 'found' : 'empty')
    
    if (cloneData) {
      try {
        const data = JSON.parse(cloneData)
        console.log('[NewExperimentPage] Loaded clone data:', data.name)
        
        // Clear sessionStorage to prevent re-loading on refresh
        sessionStorage.removeItem(cloneStorageKey)
        
        // Directly set the state in the store using zustand's setState API
        useExperimentWizard.setState({
          step: 1,
          name: data.name,
          projectId: data.projectId,
          type: data.type,
          inputMode: data.inputMode,
          controlUrl: data.controlUrl,
          variantUrl: data.variantUrl,
          screenshots: data.screenshots || [],
          hypothesis: data.hypothesis,
          deviceTargets: data.deviceTargets,
          script: data.script,
          selectedPersonaIds: data.selectedPersonaIds || [],
          runsPerPersona: data.runsPerPersona || 3,
          isClone: true,
        })
        
        console.log('[NewExperimentPage] Store updated with clone data')
        setCloneLoaded(true)
      } catch (e) {
        console.error('[NewExperimentPage] Error parsing clone data:', e)
      }
    }
    
    setIsHydrated(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchProjects = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load projects')
        return
      }

      setProjects(data || [])
      
      // Apply URL params if no clone/draft data was loaded
      if (!isClone && !cloneLoaded && isHydrated) {
        if (typeParam) {
          useExperimentWizard.setState({ type: typeParam })
        }
        if (projectParam && data?.some(p => p.id === projectParam)) {
          useExperimentWizard.setState({ projectId: projectParam })
        }
      }
      
      setIsLoading(false)
    }

    fetchProjects()
  }, [isHydrated, typeParam, projectParam, isClone, cloneLoaded])

  // Track if we should reset on unmount
  // Don't reset during Strict Mode's double-mount cycle
  const shouldResetRef = useRef(false)
  
  useEffect(() => {
    // After a short delay, set the flag to allow reset on true unmount
    const timer = setTimeout(() => {
      shouldResetRef.current = true
    }, 100)
    
    return () => {
      clearTimeout(timer)
      // Only reset if we've been mounted long enough (not just Strict Mode cycle)
      if (shouldResetRef.current) {
        reset()
      }
    }
  }, [reset])

  const handleCancel = () => {
    reset()
  }

  const handleSaveDraft = async () => {
    const {
      name,
      projectId,
      type,
      inputMode,
      controlUrl,
      variantUrl,
      screenshots,
      hypothesis,
      deviceTargets,
      script,
      selectedPersonaIds,
      runsPerPersona,
    } = useExperimentWizard.getState()

    // Validate minimum required fields
    if (!name.trim()) {
      toast.error('Please enter an experiment name to save as draft')
      return
    }

    if (!projectId) {
      toast.error('Please select a project to save as draft')
      return
    }

    setIsSavingDraft(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to save drafts')
        return
      }

      // Prepare experiment data
      const experimentData = {
        user_id: user.id,
        project_id: projectId,
        name: name.trim(),
        type,
        input_mode: inputMode,
        input_links: inputMode === 'live_url'
          ? { single: controlUrl }
          : {},
        screenshots: inputMode === 'screenshots' ? screenshots : [],
        thumbnail_url: inputMode === 'screenshots' && screenshots.length > 0
          ? (screenshots as ExperimentScreenshot[])[0].url
          : null,
        script: script || null,
        hypothesis: hypothesis || null,
        device_targets: deviceTargets,
        status: 'draft' as const,
      }

      let experimentId = draftId

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('experiments')
          .update(experimentData)
          .eq('id', draftId)

        if (error) throw error
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('experiments')
          .insert(experimentData)
          .select('id')
          .single()

        if (error) throw error
        experimentId = data.id
        setDraftId(data.id)
      }

      // Save experiment personas if any are selected
      if (selectedPersonaIds.length > 0 && experimentId) {
        // Delete existing experiment_personas for this draft
        await supabase
          .from('experiment_personas')
          .delete()
          .eq('experiment_id', experimentId)

        // Insert new experiment_personas
        const personaInserts = selectedPersonaIds.map(personaId => ({
          experiment_id: experimentId,
          persona_id: personaId,
          runs_count: runsPerPersona,
        }))

        const { error: personaError } = await supabase
          .from('experiment_personas')
          .insert(personaInserts)

        if (personaError) {
          console.error('Error saving personas:', personaError)
          // Don't throw, draft was saved successfully
        }
      }

      toast.success('Draft saved successfully!')
    } catch (error) {
      console.error('Save draft error:', error)
      toast.error('Failed to save draft')
    } finally {
      setIsSavingDraft(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Clone/Draft Banner */}
      {isHydrated && (isClone || cloneLoaded) && name && (
        <div className={cn(
          "border-b px-4 lg:px-8 py-3",
          draftId ? "bg-amber-50 border-amber-200" : "bg-primary/10 border-primary/20"
        )}>
          <div className="flex items-center gap-3 text-sm">
            {draftId ? (
              <>
                <Save className="h-4 w-4 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  Editing draft: {name}
                </span>
                <span className="text-amber-600/80">
                  — Continue editing your draft. Save Draft to update, or launch when ready.
                </span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-primary" />
                <span className="text-primary font-medium">
                  Cloning experiment: {name}
                </span>
                <span className="text-muted-foreground">
                  — Review and modify the settings below, then launch when ready.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-card px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/experiments" onClick={handleCancel}>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {isHydrated && isClone ? 'Clone Experiment' : 'New Experiment'}
            </h1>
          </div>
        </div>
        <WizardProgress currentStep={step} steps={steps} />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSaveDraft}
          disabled={isSavingDraft}
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
        <div className="max-w-5xl mx-auto">
          {(isLoading || !isHydrated) ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-64 bg-muted rounded" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border">
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                Create a project first before starting an experiment.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <>
              {step === 1 && <StepDetails projects={projects} />}
              {step === 2 && <StepScript />}
              {step === 3 && <StepPersonas />}
              {step === 4 && <StepReview projects={projects} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
