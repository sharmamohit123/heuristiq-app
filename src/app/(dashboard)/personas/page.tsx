'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Persona } from '@/types/database'
import { PersonaCard } from '@/components/personas/persona-card'
import { PersonaForm } from '@/components/personas/persona-form'
import { ImportPersonasDialog } from '@/components/personas/import-personas-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null)

  const fetchPersonas = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })  // Changed to ascending - new personas at end

    if (error) {
      toast.error('Failed to load personas')
      return
    }

    setPersonas(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPersonas()
  }, [])

  useEffect(() => {
    let filtered = personas

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (deviceFilter !== 'all') {
      filtered = filtered.filter((p) => p.device_type === deviceFilter)
    }

    if (experienceFilter !== 'all') {
      filtered = filtered.filter((p) => p.experience_level === experienceFilter)
    }

    setFilteredPersonas(filtered)
  }, [personas, searchQuery, deviceFilter, experienceFilter])

  const handleEdit = (persona: Persona) => {
    setSelectedPersona(persona)
    setFormMode('edit')
    setFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedPersona(null)
    setFormMode('create')
    setFormOpen(true)
  }

  const handleDuplicate = async (persona: Persona) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Generate same avatar URL as parent using name seed
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${persona.name}&backgroundColor=5850ec,8b5cf6,ec4899&textColor=ffffff`

    const { error } = await supabase.from('personas').insert({
      user_id: user.id,
      name: `${persona.name} (Copy)`,
      description: persona.description,
      device_type: persona.device_type,
      experience_level: persona.experience_level,
      patience_level: persona.patience_level,
      avatar_url: avatarUrl,  // Same avatar as parent
    })

    if (error) {
      toast.error('Failed to duplicate persona')
      return
    }

    toast.success('Persona duplicated!')
    fetchPersonas()
  }

  const handleDelete = async () => {
    if (!personaToDelete) return

    const supabase = createClient()
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaToDelete.id)

    if (error) {
      toast.error('Failed to delete persona')
      return
    }

    toast.success('Persona deleted')
    setDeleteDialogOpen(false)
    setPersonaToDelete(null)
    fetchPersonas()
  }

  const confirmDelete = (persona: Persona) => {
    setPersonaToDelete(persona)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-card px-4 lg:px-8 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Persona Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage, compare, and configure your autonomous testing agents.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ImportPersonasDialog onImportComplete={fetchPersonas} />
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Persona
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex flex-1 flex-col md:flex-row gap-4 w-full md:w-auto items-start md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or trait..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              {filteredPersonas.length} of {personas.length} Personas
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredPersonas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
            {filteredPersonas.map((persona) => (
              <PersonaCard
                key={persona.id}
                persona={persona}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
            
            {/* Create New Card */}
            <button
              onClick={handleCreate}
              className="group flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer text-center p-8"
            >
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <h3 className="text-lg font-bold">Create New Persona</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
                Define a custom AI agent with specific traits and behaviors.
              </p>
            </button>
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No personas found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || deviceFilter !== 'all' || experienceFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first persona to start testing'}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Persona
            </Button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <PersonaForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            fetchPersonas()
          }
        }}
        persona={selectedPersona}
        mode={formMode}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Persona</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{personaToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
