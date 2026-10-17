'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { createClient } from '@/lib/supabase/client'
import { Persona, Project } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Rocket, Globe, GitCompare, Monitor, Smartphone, Users, FileText, ImageIcon, Link } from 'lucide-react'

interface StepReviewProps {
  projects: Project[]
}

export function StepReview({ projects }: StepReviewProps) {
  const router = useRouter()
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
    prevStep,
    reset,
  } = useExperimentWizard()

  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(true)

  useEffect(() => {
    const fetchPersonas = async () => {
      if (selectedPersonaIds.length === 0) {
        setIsLoadingPersonas(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from('personas')
        .select('*')
        .in('id', selectedPersonaIds)

      setPersonas(data || [])
      setIsLoadingPersonas(false)
    }

    fetchPersonas()
  }, [selectedPersonaIds])

  const project = projects.find((p) => p.id === projectId)
  const totalRuns = selectedPersonaIds.length * runsPerPersona
  const estimatedTime = totalRuns * 2

  const handleLaunch = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Determine input_links based on mode
      const input_links = inputMode === 'screenshots'
        ? {} // No URLs for screenshot mode
        : type === 'ab_test'
          ? { control: controlUrl, variant: variantUrl }
          : { single: controlUrl }

      // Get thumbnail from first screenshot (for screenshot mode)
      // For live_url mode, thumbnail will be set after test completion
      const thumbnail_url = inputMode === 'screenshots' && screenshots.length > 0
        ? screenshots[0].url
        : null

      // Create the experiment
      const { data: experiment, error: experimentError } = await supabase
        .from('experiments')
        .insert({
          user_id: user.id,
          project_id: projectId,
          name,
          type,
          input_mode: inputMode,
          input_links,
          screenshots: screenshots,
          thumbnail_url,
          script,
          hypothesis,
          device_targets: deviceTargets,
          status: 'queued',
        })
        .select()
        .single()

      if (experimentError) {
        toast.error(experimentError.message)
        return
      }

      // Create experiment_personas entries
      const personaEntries = selectedPersonaIds.map((personaId) => ({
        experiment_id: experiment.id,
        persona_id: personaId,
        runs_count: runsPerPersona,
      }))

      const { error: personasError } = await supabase
        .from('experiment_personas')
        .insert(personaEntries)

      if (personasError) {
        toast.error('Failed to assign personas')
        return
      }

      toast.success('Experiment launched!')
      reset()
      router.push(`/experiments/${experiment.id}?autostart=true`)
    } catch (error) {
      toast.error('Failed to create experiment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review & Launch</h2>
        <p className="text-muted-foreground mt-1">
          Review your experiment configuration before launching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experiment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Experiment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</p>
              <p className="font-medium mt-1">{name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project</p>
              <p className="font-medium mt-1">{project?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">
                  {type === 'ab_test' ? (
                    <><GitCompare className="h-3 w-3 mr-1" /> A/B Experiment</>
                  ) : (
                    <><Globe className="h-3 w-3 mr-1" /> Usability Experiment</>
                  )}
                </Badge>
                <Badge variant="outline">
                  {inputMode === 'screenshots' ? (
                    <><ImageIcon className="h-3 w-3 mr-1" /> Screenshots</>
                  ) : (
                    <><Link className="h-3 w-3 mr-1" /> URL</>
                  )}
                </Badge>
              </div>
            </div>
            
            {/* Target - URLs or Screenshots */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {inputMode === 'screenshots' ? 'Screenshots' : 'Target URLs'}
              </p>
              {inputMode === 'screenshots' ? (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {screenshots.map((screenshot, index) => (
                    <div key={screenshot.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={screenshot.url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                        <p className="text-[10px] text-white truncate">{screenshot.context || `Screen ${index + 1}`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-1 space-y-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                    https://{controlUrl}
                  </code>
                  {variantUrl && (
                    <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                      https://{variantUrl}
                    </code>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Devices</p>
              <div className="flex gap-2 mt-1">
                {deviceTargets.map((device) => (
                  <Badge key={device} variant="outline">
                    {device === 'desktop' ? <Monitor className="h-3 w-3 mr-1" /> : <Smartphone className="h-3 w-3 mr-1" />}
                    {device}
                  </Badge>
                ))}
              </div>
            </div>
            
            {hypothesis && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Research Hypothesis</p>
                <p className="text-sm mt-1 text-muted-foreground">{hypothesis}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personas & Script */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Selected Personas ({selectedPersonaIds.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPersonas ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 bg-muted rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {personas.map((persona) => (
                    <div key={persona.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {persona.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{persona.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {persona.experience_level} • {persona.device_type}
                        </p>
                      </div>
                      <Badge variant="secondary">{runsPerPersona}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Experiment Script Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap font-mono">
                {script || 'No script defined'}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{totalRuns}</p>
              <p className="text-xs text-muted-foreground">Total Runs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{selectedPersonaIds.length}</p>
              <p className="text-xs text-muted-foreground">Personas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">~{estimatedTime} min</p>
              <p className="text-xs text-muted-foreground">Est. Duration</p>
            </div>
            {inputMode === 'screenshots' && (
              <div>
                <p className="text-2xl font-bold text-primary">{screenshots.length}</p>
                <p className="text-xs text-muted-foreground">Screenshots</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep} disabled={isLoading}>
          Back
        </Button>
        <Button onClick={handleLaunch} disabled={isLoading} size="lg">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              Launch Experiment
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
