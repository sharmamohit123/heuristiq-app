'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { PersonaSummary } from '@/lib/stores/parallel-runs'

interface PersonaConsoleTabsProps {
  personas: PersonaSummary[]
  activePersonaId: string | null
  onPersonaSelect: (personaId: string) => void
  className?: string
}

const statusConfig: Record<string, {
  icon: typeof Clock
  color: string
  bgColor: string
  label: string
  animate?: boolean
}> = {
  pending: { 
    icon: Clock, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-500/20',
    label: 'Pending',
    animate: false,
  },
  running: { 
    icon: Loader2, 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    label: 'Running',
    animate: true,
  },
  completed: { 
    icon: CheckCircle2, 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    label: 'Completed',
    animate: false,
  },
  error: { 
    icon: XCircle, 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    label: 'Error',
    animate: false,
  },
}

export function PersonaConsoleTabs({
  personas,
  activePersonaId,
  onPersonaSelect,
  className,
}: PersonaConsoleTabsProps) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto pb-2', className)}>
      <TooltipProvider>
        {personas.map((summary) => {
          const config = statusConfig[summary.status]
          const StatusIcon = config.icon
          const isActive = summary.personaId === activePersonaId

          return (
            <Tooltip key={summary.personaId}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPersonaSelect(summary.personaId)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                    'border border-transparent',
                    isActive 
                      ? 'bg-primary/10 border-primary/50 text-primary' 
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-6 w-6">
                    <AvatarFallback 
                      className={cn(
                        'text-xs',
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {summary.personaName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <span className="text-sm font-medium whitespace-nowrap">
                    {summary.personaName}
                  </span>

                  {/* Status indicator */}
                  <div className={cn('flex items-center gap-1', config.color)}>
                    <StatusIcon 
                      className={cn(
                        'h-3.5 w-3.5',
                        config.animate && 'animate-spin'
                      )} 
                    />
                  </div>

                  {/* Progress badge */}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      'text-xs px-1.5 py-0',
                      config.bgColor,
                      config.color
                    )}
                  >
                    {summary.completedRuns}/{summary.totalRuns}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">
                  <p className="font-medium">{summary.personaName}</p>
                  <p className="text-muted-foreground mt-1">
                    {summary.completedRuns} of {summary.totalRuns} runs completed
                    {summary.failedRuns > 0 && ` (${summary.failedRuns} failed)`}
                  </p>
                  <p className={cn('mt-1', config.color)}>
                    Status: {config.label}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}

/**
 * Compact variant for smaller spaces
 */
export function PersonaConsoleTabsCompact({
  personas,
  activePersonaId,
  onPersonaSelect,
  className,
}: PersonaConsoleTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto', className)}>
      <TooltipProvider>
        {personas.map((summary) => {
          const config = statusConfig[summary.status]
          const StatusIcon = config.icon
          const isActive = summary.personaId === activePersonaId

          return (
            <Tooltip key={summary.personaId}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPersonaSelect(summary.personaId)}
                  className={cn(
                    'relative flex items-center justify-center p-2 rounded-lg transition-all',
                    isActive 
                      ? 'bg-primary/10 ring-1 ring-primary/50' 
                      : 'hover:bg-muted/50'
                  )}
                >
                  {/* Avatar with status ring */}
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback 
                        className={cn(
                          'text-xs',
                          isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {summary.personaName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Status dot */}
                    <div 
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background flex items-center justify-center',
                        config.bgColor
                      )}
                    >
                      <StatusIcon 
                        className={cn(
                          'h-2 w-2',
                          config.color,
                          config.animate && 'animate-spin'
                        )} 
                      />
                    </div>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">
                  <p className="font-medium">{summary.personaName}</p>
                  <p className="text-muted-foreground">
                    {summary.completedRuns}/{summary.totalRuns} runs • {config.label}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
