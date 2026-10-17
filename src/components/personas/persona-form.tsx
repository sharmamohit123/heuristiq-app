'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Persona, DeviceType, ExperienceLevel, PatienceLevel } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface PersonaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona?: Persona | null
  mode: 'create' | 'edit'
  onSuccess?: (persona: Persona) => void
}

export function PersonaForm({ open, onOpenChange, persona, mode, onSuccess }: PersonaFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate')
  const [patienceLevel, setPatienceLevel] = useState<PatienceLevel>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Prefill form when dialog opens or persona changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && persona) {
        setName(persona.name)
        setDescription(persona.description || '')
        setDeviceType(persona.device_type)
        setExperienceLevel(persona.experience_level)
        setPatienceLevel(persona.patience_level)
      } else {
        setName('')
        setDescription('')
        setDeviceType('desktop')
        setExperienceLevel('intermediate')
        setPatienceLevel('medium')
      }
    }
  }, [open, mode, persona])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      if (mode === 'create') {
        const { data: newPersona, error } = await supabase.from('personas').insert({
          user_id: user.id,
          name,
          description,
          device_type: deviceType,
          experience_level: experienceLevel,
          patience_level: patienceLevel,
        }).select().single()

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success('Persona created!')
        
        // Call onSuccess callback with the new persona
        if (onSuccess && newPersona) {
          onSuccess(newPersona as Persona)
        }
      } else if (persona) {
        const { error } = await supabase
          .from('personas')
          .update({
            name,
            description,
            device_type: deviceType,
            experience_level: experienceLevel,
            patience_level: patienceLevel,
          })
          .eq('id', persona.id)

        if (error) {
          toast.error(error.message)
          return
        }

        toast.success('Persona updated!')
      }

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Persona' : 'Edit Persona'}</DialogTitle>
          <DialogDescription>
            Define the characteristics of this synthetic user persona.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Persona Name</Label>
              <Input
                id="name"
                placeholder="e.g., Tech-Savvy Shopper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this persona's behaviors, preferences, and goals..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select value={deviceType} onValueChange={(v) => setDeviceType(v as DeviceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Experience Level</Label>
                <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(v as ExperienceLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Patience Level</Label>
                <Select value={patienceLevel} onValueChange={(v) => setPatienceLevel(v as PatienceLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Persona' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
