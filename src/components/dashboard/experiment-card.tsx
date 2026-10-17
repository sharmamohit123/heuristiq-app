'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExperimentStatus, InputMode, ExperimentScreenshot, DeviceType } from '@/types/database'
import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ImageIcon, Link as LinkIcon, MoreVertical, Copy, Trash2, ExternalLink, FileText, Loader2, FolderOpen } from 'lucide-react'
import { ExperimentThumbnail } from '@/components/experiments/experiment-thumbnail'
import { REVIEW_STEP, stashDraftForWizard } from '@/lib/open-draft'

interface ExperimentCardProps {
  experiment: {
    id: string
    name: string
    type: 'usability' | 'ab_test'
    status: ExperimentStatus
    input_mode?: InputMode
    input_links?: Record<string, unknown>
    screenshots?: unknown
    thumbnail_url?: string | null
    hypothesis?: string | null
    device_targets?: string[]
    script?: string | null
    project_id?: string
    created_at: string
    is_demo?: boolean
    project?: { name: string }
  }
  onDelete?: () => void
}

const statusConfig: Record<ExperimentStatus, { label: string; className: string; dot?: boolean }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
  queued: { label: 'Queued', className: 'bg-yellow-100 text-yellow-700' },
  running: { label: 'Running', className: 'bg-white/90 text-primary', dot: true },
  completed: { label: 'Completed', className: 'bg-white/90 text-gray-700' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
}

export function ExperimentCard({ experiment, onDelete }: ExperimentCardProps) {
  const router = useRouter()
  const populateFromClone = useExperimentWizard((state) => state.populateFromClone)
  const [isCloning, setIsCloning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)

  const status = statusConfig[experiment.status]
  const timeAgo = formatDistanceToNow(new Date(experiment.created_at), { addSuffix: true })
  const inputMode = experiment.input_mode || 'live_url'
  // Thumbnail can be present for any input mode (screenshots, url, or live_url)
  const hasThumbnail = !!experiment.thumbnail_url
  const isDraft = experiment.status === 'draft'

  // Handle clicking on a draft experiment - redirect to wizard with draft data
  const handleDraftClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLoadingDraft(true)

    try {
      await stashDraftForWizard(experiment, experiment.is_demo ? REVIEW_STEP : 1)
      toast.success(experiment.is_demo ? 'Opening demo experiment...' : 'Opening draft for editing...')
      router.push('/experiments/new')
    } catch (error) {
      console.error('Load draft error:', error)
      toast.error('Failed to load draft')
    } finally {
      setIsLoadingDraft(false)
    }
  }

  const handleClone = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsCloning(true)

    try {
      const supabase = createClient()
      
      // Fetch experiment personas
      const { data: existingPersonas } = await supabase
        .from('experiment_personas')
        .select('persona_id, runs_count')
        .eq('experiment_id', experiment.id)

      const personaIds = existingPersonas?.map((ep) => ep.persona_id) || []
      const runsPerPersona = existingPersonas?.[0]?.runs_count || 3

      // Parse input links
      const inputLinks = (experiment.input_links || {}) as { control?: string; variant?: string; single?: string }
      const screenshots = (experiment.screenshots as unknown as ExperimentScreenshot[]) || []

      // Populate wizard store
      populateFromClone({
        name: `${experiment.name} (Copy)`,
        projectId: experiment.project_id || '',
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
      })

      // Small delay to ensure store persists before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      toast.success('Opening experiment wizard with cloned data...')
      router.push('/experiments/new')
    } catch (error) {
      console.error('Clone error:', error)
      toast.error('Failed to clone experiment')
    } finally {
      setIsCloning(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experiment.id)

      if (error) throw error

      toast.success('Experiment deleted')
      onDelete?.()
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete experiment')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative bg-card rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
      {/* Actions Dropdown */}
      <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 bg-white/90 hover:bg-white text-gray-700 shadow-sm rounded-md"
              onClick={(e) => e.preventDefault()}
            >
              {isCloning || isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/experiments/${experiment.id}`} className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            {experiment.status === 'completed' && (
              <DropdownMenuItem asChild>
                <Link href={`/experiments/${experiment.id}/report`} className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClone} disabled={isCloning}>
              <Copy className="h-4 w-4 mr-2" />
              Clone & Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Card Content - clickable area */}
      {isDraft ? (
        <div 
          onClick={handleDraftClick} 
          className="relative flex flex-col h-full cursor-pointer"
        >
          {isLoadingDraft && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {/* Thumbnail/Preview */}
          <div className="relative">
            <ExperimentThumbnail
              inputMode={inputMode}
              experimentType={experiment.type}
              deviceTargets={experiment.device_targets || ['desktop']}
              thumbnailUrl={experiment.thumbnail_url}
              status={experiment.status}
            />
            
            {/* Status Badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className={cn(
                'px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm flex items-center gap-1',
                status.className
              )}>
                {status.dot && (
                  <span className="block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                {status.label}
              </span>
            </div>

            {/* Input Mode Badge */}
            <div className="absolute bottom-3 right-3 z-10">
              <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-black/50 text-white flex items-center gap-1">
                {inputMode === 'screenshots' ? (
                  <><ImageIcon className="h-3 w-3" /> Screenshots</>
                ) : (
                  <><LinkIcon className="h-3 w-3" /> URL</>
                )}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {experiment.name}
              </h3>
                {experiment.project?.name && (
                  <div className="flex items-center gap-1 mt-1">
                    <FolderOpen className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {experiment.project.name}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {timeAgo}
              </span>
            </div>
            
            {experiment.hypothesis && (
              <p className="text-muted-foreground text-sm leading-snug line-clamp-2">
                {experiment.hypothesis}
              </p>
            )}

            <div className="mt-auto pt-4 flex flex-wrap gap-2">
              {experiment.is_demo && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                  Demo · ready to launch
                </Badge>
              )}
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                {experiment.type === 'usability' ? 'Usability' : 'A/B Experiment'}
              </Badge>
              {experiment.device_targets?.map((device) => (
                <Badge key={device} variant="outline" className="capitalize">
                  {device}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <Link href={`/experiments/${experiment.id}`} className="flex flex-col h-full">
          {/* Thumbnail/Preview */}
          <div className="relative">
            <ExperimentThumbnail
              inputMode={inputMode}
              experimentType={experiment.type}
              deviceTargets={experiment.device_targets || ['desktop']}
              thumbnailUrl={experiment.thumbnail_url}
              status={experiment.status}
            />
            
          {/* Status Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={cn(
              'px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm flex items-center gap-1',
              status.className
            )}>
              {status.dot && (
                <span className="block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              )}
              {status.label}
            </span>
          </div>

          {/* Input Mode Badge */}
          <div className="absolute bottom-3 right-3 z-10">
            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-black/50 text-white flex items-center gap-1">
              {inputMode === 'screenshots' ? (
                <><ImageIcon className="h-3 w-3" /> Screenshots</>
              ) : (
                <><LinkIcon className="h-3 w-3" /> URL</>
              )}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {experiment.name}
            </h3>
              {experiment.project?.name && (
                <div className="flex items-center gap-1 mt-1">
                  <FolderOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {experiment.project.name}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {timeAgo}
            </span>
          </div>
          
          {experiment.hypothesis && (
            <p className="text-muted-foreground text-sm leading-snug line-clamp-2">
              {experiment.hypothesis}
            </p>
          )}

          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
              {experiment.type === 'usability' ? 'Usability' : 'A/B Experiment'}
            </Badge>
            {experiment.device_targets?.map((device) => (
              <Badge key={device} variant="outline" className="capitalize">
                {device}
              </Badge>
            ))}
          </div>
        </div>
      </Link>
      )}
    </div>
  )
}
