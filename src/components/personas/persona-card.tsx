'use client'

import { Persona } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Pencil, Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PersonaCardProps {
  persona: Persona
  onEdit?: (persona: Persona) => void
  onDelete?: (persona: Persona) => void
  onDuplicate?: (persona: Persona) => void
  selected?: boolean
  onSelect?: (persona: Persona) => void
  selectable?: boolean
}

const experienceLevelConfig = {
  beginner: { label: 'Beginner', value: 30, color: 'bg-blue-500' },
  intermediate: { label: 'Average', value: 55, color: 'bg-primary' },
  expert: { label: 'Expert', value: 92, color: 'bg-primary' },
}

const patienceLevelConfig = {
  low: { label: 'Low', value: 24, color: 'bg-rose-500' },
  medium: { label: 'Medium', value: 60, color: 'bg-yellow-400' },
  high: { label: 'High', value: 80, color: 'bg-emerald-500' },
}

const deviceTypeConfig = {
  mobile: { label: 'Mobile', badge: 'bg-purple-50 text-purple-700 border-purple-100' },
  desktop: { label: 'Desktop', badge: 'bg-gray-50 text-gray-700 border-gray-200' },
  tablet: { label: 'Tablet', badge: 'bg-blue-50 text-blue-700 border-blue-100' },
}

export function PersonaCard({
  persona,
  onEdit,
  onDelete,
  onDuplicate,
  selected,
  onSelect,
  selectable,
}: PersonaCardProps) {
  const experience = experienceLevelConfig[persona.experience_level]
  const patience = patienceLevelConfig[persona.patience_level]
  const device = deviceTypeConfig[persona.device_type]

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200',
        selected && 'ring-2 ring-primary border-primary',
        selectable && 'cursor-pointer'
      )}
      onClick={() => selectable && onSelect?.(persona)}
    >
      {/* Selection Checkbox */}
      {selectable && (
        <div className="absolute top-4 right-4 z-10">
          <div
            className={cn(
              'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors',
              selected
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300 bg-white'
            )}
          >
            {selected && (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Card Header */}
      <div className="p-5 flex gap-4 items-start border-b">
        <div className="relative shrink-0">
          <Avatar className="h-16 w-16 border-2 border-white shadow-md bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
            <AvatarImage src={persona.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${persona.name}&backgroundColor=5850ec,8b5cf6,ec4899&textColor=ffffff`} />
            <AvatarFallback className="text-xl font-bold text-white bg-transparent">
              {persona.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pt-1">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold truncate">{persona.name}</h3>
            {persona.is_default && (
              <Badge variant="secondary" className="text-xs">Default</Badge>
            )}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={device.badge}>
              {device.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Behavioral Traits */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <span className="text-muted-foreground">Tech Savviness</span>
            <span className="font-semibold">{experience.label}</span>
          </div>
          <Progress value={experience.value} className="h-2" />

          <div className="flex items-center justify-between text-xs font-medium mb-1 mt-3">
            <span className="text-muted-foreground">Patience</span>
            <span className="font-semibold">{patience.label}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', patience.color)}
              style={{ width: `${patience.value}%` }}
            />
          </div>
        </div>

        {persona.description && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              <span className="font-semibold">Bio:</span> {persona.description}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer */}
      {!selectable && (
        <div className="px-5 py-3 border-t bg-muted/30 rounded-b-xl flex justify-end items-center">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(persona)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicate?.(persona)
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(persona)
              }}
              disabled={persona.is_default}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
