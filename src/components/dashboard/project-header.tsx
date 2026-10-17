'use client'

import { useState } from 'react'
import { Project } from '@/types/database'
import { HelpCircle, Search, ChevronDown, Edit2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ProjectDialog } from './project-dialog'
import { NotificationBell } from '@/components/layout/notification-bell'

interface ProjectHeaderProps {
  projects: Project[]
  currentProjectId: string | null
  onProjectChange: (projectId: string) => void
  onSearch?: (query: string) => void
}

export function ProjectHeader({ projects, currentProjectId, onProjectChange, onSearch }: ProjectHeaderProps) {
  const currentProject = projects.find(p => p.id === currentProjectId)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProject(project)
    setDialogMode('edit')
    setProjectDialogOpen(true)
  }

  const handleCreateProject = () => {
    setSelectedProject(null)
    setDialogMode('create')
    setProjectDialogOpen(true)
  }

  return (
    <>
      <div className="border-b bg-white dark:bg-card px-4 lg:px-8 py-6 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
        {/* Left: Project Selector */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-primary/5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground font-medium">Current Project</span>
                  <span className="text-base font-bold">{currentProject?.name || 'Select Project'}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Switch Project
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Project List */}
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  className={`flex items-start justify-between gap-2 py-3 cursor-pointer ${
                    currentProjectId === project.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => onProjectChange(project.id)}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className={`font-medium ${currentProjectId === project.id ? 'text-primary' : ''}`}>
                      {project.name}
                    </span>
                    {project.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => handleEditProject(project, e)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />
              
              {/* Create New Project */}
              <DropdownMenuItem
                className="py-3 cursor-pointer text-primary font-medium"
                onClick={handleCreateProject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Search, Notifications, Help */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search experiments..."
              className="pl-9 w-64 bg-background"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Help */}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={selectedProject}
        mode={dialogMode}
      />
    </>
  )
}
