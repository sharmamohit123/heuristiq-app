'use client'

import { Bell, HelpCircle, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Project } from '@/types/database'

interface HeaderProps {
  projects?: Project[]
  currentProject?: Project | null
  onProjectChange?: (project: Project) => void
}

export function Header({ projects = [], currentProject, onProjectChange }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-8">
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        {projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-400 text-white shadow-md">
                  <span className="text-xs font-bold">
                    {currentProject?.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground">Current Project</span>
                  <span className="text-sm font-semibold">
                    {currentProject?.name || 'Select Project'}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onProjectChange?.(project)}
                  className={project.id === currentProject?.id ? 'bg-muted' : ''}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search experiments..."
            className="w-64 pl-9 bg-muted/50 border-0"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          <Button variant="outline" size="icon">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
