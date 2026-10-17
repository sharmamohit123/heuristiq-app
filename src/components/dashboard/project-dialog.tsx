'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Project } from '@/types/database'
import { useRouter } from 'next/navigation'

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project | null
  mode: 'create' | 'edit'
  onSuccess?: (project: Project) => void
}

export function ProjectDialog({ open, onOpenChange, project, mode, onSuccess }: ProjectDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Prefill form when dialog opens or project changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && project) {
        setName(project.name)
        setDescription(project.description || '')
      } else {
        setName('')
        setDescription('')
      }
    }
  }, [open, mode, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Project name is required')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      if (mode === 'edit' && project) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq('id', project.id)

        if (error) throw error
        toast.success('Project updated successfully!')
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
          })
          .select()
          .single()

        if (error) throw error
        toast.success('Project created successfully!')
        
        // Call onSuccess callback with the new project
        if (onSuccess && newProject) {
          onSuccess(newProject as Project)
        }
      }

      onOpenChange(false)
      setName('')
      setDescription('')
      router.refresh()
    } catch (error) {
      console.error('Project operation error:', error)
      toast.error(mode === 'edit' ? 'Failed to update project' : 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'edit' 
                ? 'Update your project details below.' 
                : 'Create a new project to organize your experiments.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., E-commerce Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'edit' ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
