'use client'

import { useCallback, useState, useEffect } from 'react'
import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { Project, DeviceType, InputMode, ExperimentScreenshot } from '@/types/database'
import { ProjectDialog } from '@/components/dashboard/project-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Globe, Monitor, Smartphone, Link, ImageIcon, Upload, X, Plus, Loader2, Play, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface StepDetailsProps {
  projects: Project[]
}

const MAX_SCREENSHOTS = 10

export function StepDetails({ projects: initialProjects }: StepDetailsProps) {
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
    updateDetails,
    addScreenshot,
    removeScreenshot,
    nextStep,
  } = useExperimentWizard()

  const [isUploading, setIsUploading] = useState(false)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)

  // Update projects when initialProjects changes
  useEffect(() => {
    setProjects(initialProjects)
  }, [initialProjects])

  const handleProjectCreated = (newProject: Project) => {
    // Add the new project to the list
    setProjects((prev) => [...prev, newProject])
    // Auto-select the new project
    updateDetails({ projectId: newProject.id })
    toast.success(`Project "${newProject.name}" has been created and selected`)
  }

  const toggleDevice = (device: DeviceType) => {
    const newDevices = deviceTargets.includes(device)
      ? deviceTargets.filter((d) => d !== device)
      : [...deviceTargets, device]
    
    if (newDevices.length > 0) {
      updateDetails({ deviceTargets: newDevices })
    }
  }

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const remainingSlots = MAX_SCREENSHOTS - screenshots.length
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    setIsUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      for (const file of filesToUpload) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        const fileExt = file.name.split('.').pop()
        // Generate highly unique filename to prevent collisions
        // Format: userId/timestamp-randomId-fileIndex-originalName.ext
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 10)
        const fileIndex = screenshots.length + Array.from(filesToUpload).indexOf(file)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 30)
        const fileName = `${user.id}/${timestamp}-${randomId}-${fileIndex}-${sanitizedName}`
        
        const { data, error } = await supabase.storage
          .from('experiment-screenshots')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,  // Changed to true - overwrites if collision occurs
          })

        if (error) {
          console.error('Upload error:', error)
          toast.error(`Failed to upload ${file.name}`)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('experiment-screenshots')
          .getPublicUrl(data.path)

        const newScreenshot: ExperimentScreenshot = {
          id: Math.random().toString(36).substring(7),
          storage_path: data.path,
          url: publicUrl,
          context: '',
          order: screenshots.length,
        }

        addScreenshot(newScreenshot)
      }

      toast.success('Screenshots uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload screenshots')
    } finally {
      setIsUploading(false)
    }
  }, [screenshots.length, addScreenshot])

  const handleRemoveScreenshot = async (screenshot: ExperimentScreenshot) => {
    try {
      const supabase = createClient()
      await supabase.storage
        .from('experiment-screenshots')
        .remove([screenshot.storage_path])
      
      removeScreenshot(screenshot.id)
    } catch (error) {
      console.error('Delete error:', error)
      removeScreenshot(screenshot.id)
    }
  }

  const canContinue = name && projectId && (
    inputMode === 'live_url' ? controlUrl : screenshots.length > 0
  )

  return (
    <div className="space-y-8">
      {/* Experiment Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-semibold">Experiment Name</Label>
        <Input
          id="name"
          placeholder="e.g., Q3 Checkout Flow Optimization V2"
          value={name}
          onChange={(e) => updateDetails({ name: e.target.value })}
          className="h-11"
        />
      </div>

      {/* Project Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Project</Label>
        <Select 
          value={projectId} 
          onValueChange={(v) => {
            if (v === '__create_new__') {
              setIsProjectDialogOpen(true)
            } else {
              updateDetails({ projectId: v })
            }
          }}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
            <SelectItem value="__create_new__" className="text-primary font-medium">
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Project
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Experiment Type */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Experiment Type</Label>
        <div className="grid grid-cols-1 gap-4">
          <label
            className={cn(
              'relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50',
              type === 'usability' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
            )}
          >
            <input
              type="radio"
              name="type"
              value="usability"
              checked={type === 'usability'}
              onChange={() => updateDetails({ type: 'usability' })}
              className="sr-only"
            />
            <Globe className="h-5 w-5 text-teal-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Usability Experiment</span>
              <p className="text-xs text-muted-foreground mt-1">
                Analyze a page or screens for usability issues and heuristic violations.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Target Definition */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Target Definition</Label>
          
          {/* Input Mode Toggle - Only for Usability Experiment */}
          {type === 'usability' && (
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-xs font-medium',
                  inputMode === 'live_url' && 'bg-background shadow-sm'
                )}
                onClick={() => updateDetails({ inputMode: 'live_url' as InputMode })}
              >
                <Link className="h-3.5 w-3.5 mr-1.5" />
                URL
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-xs font-medium',
                  inputMode === 'screenshots' && 'bg-background shadow-sm'
                )}
                onClick={() => updateDetails({ inputMode: 'screenshots' as InputMode })}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                Screenshots
              </Button>
            </div>
          )}
        </div>

        {/* URL Input Mode */}
        {inputMode === 'live_url' && (
          <div className="space-y-4">
            {/* Live URL Mode Description - for usability tests */}
            {inputMode === 'live_url' && type === 'usability' && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Play className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Live URL Testing</p>
                  <p className="text-xs text-muted-foreground">
                    AI personas will autonomously navigate and interact with the website in real-time, 
                    capturing video recordings and screenshots of their journey. This provides the most 
                    realistic simulation of user behavior.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Live tests take 2-5 minutes per persona run</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="controlUrl" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {type === 'ab_test' ? 'Control (A)' : 'Starting URL'}
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                    https://
                  </span>
                  <Input
                    id="controlUrl"
                    placeholder="yourapp.com (AI will navigate from here)"
                    value={controlUrl}
                    onChange={(e) => updateDetails({ controlUrl: e.target.value })}
                    className="pl-16 h-11 font-mono text-sm"
                  />
                </div>
                {type === 'usability' && (
                  <p className="text-xs text-muted-foreground">
                    The AI will start browsing from this URL and navigate autonomously based on your research goal.
                  </p>
                )}
              </div>

              {type === 'ab_test' && (
                <div className="space-y-2">
                  <Label htmlFor="variantUrl" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Variant (B)
                  </Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                      https://
                    </span>
                    <Input
                      id="variantUrl"
                      placeholder="example.com/checkout-v2"
                      value={variantUrl}
                      onChange={(e) => updateDetails({ variantUrl: e.target.value })}
                      className="pl-16 h-11 font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Screenshot Upload Mode */}
        {inputMode === 'screenshots' && type === 'usability' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Uploaded Screenshots */}
              {screenshots.map((screenshot, index) => (
                <div
                  key={screenshot.id}
                  className="relative aspect-[4/3] rounded-xl border-2 border-dashed bg-muted/30 overflow-hidden group"
                >
                  <img
                    src={screenshot.url}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveScreenshot(screenshot)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <span className="text-white text-xs font-medium">Screen {index + 1}</span>
                  </div>
                </div>
              ))}

              {/* Upload Button */}
              {screenshots.length < MAX_SCREENSHOTS && (
                <label
                  className={cn(
                    'relative aspect-[4/3] rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center p-4',
                    isUploading
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e.target.files)}
                    className="sr-only"
                    disabled={isUploading}
                  />
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Drop screenshot here</p>
                        <p className="text-[10px] text-muted-foreground">or click to browse</p>
                      </div>
                    </>
                  )}
                </label>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5" />
              Upload up to {MAX_SCREENSHOTS} screenshots. You&apos;ll add context for each on the next step.
            </p>
          </div>
        )}
      </div>

      {/* Hypothesis & Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-2">
          <Label htmlFor="hypothesis" className="text-sm font-semibold">
            Experiment Goal & Hypothesis
            {/* <span className="ml-1 text-xs font-normal text-muted-foreground">(Instructions for the AI Agent)</span> */}
          </Label>
          <Textarea
            id="hypothesis"
            placeholder="Describe what you want to find out. E.g., 'Identify any friction points in the payment form for mobile users'"
            value={hypothesis}
            onChange={(e) => updateDetails({ hypothesis: e.target.value })}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold">Device Targets</Label>
          <div className="flex flex-col gap-3">
            <label
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                deviceTargets.includes('desktop')
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              )}
            >
              <Checkbox
                checked={deviceTargets.includes('desktop')}
                onCheckedChange={() => toggleDevice('desktop')}
              />
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Desktop</span>
            </label>
            <label
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                deviceTargets.includes('mobile')
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              )}
            >
              <Checkbox
                checked={deviceTargets.includes('mobile')}
                onCheckedChange={() => toggleDevice('mobile')}
              />
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Mobile Web</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={nextStep} disabled={!canContinue} size="lg">
          Continue to Script
        </Button>
      </div>

      {/* Create Project Dialog */}
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        mode="create"
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}
