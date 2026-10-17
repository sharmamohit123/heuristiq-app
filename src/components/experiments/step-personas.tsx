'use client'

import { useState, useEffect } from 'react'
import { useExperimentWizard } from '@/lib/stores/experiment-wizard'
import { createClient } from '@/lib/supabase/client'
import { Persona } from '@/types/database'
import { PersonaCard } from '@/components/personas/persona-card'
import { PersonaForm } from '@/components/personas/persona-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus } from 'lucide-react'
import { toast } from 'sonner'

export function StepPersonas() {
  const { selectedPersonaIds, runsPerPersona, updatePersonas, nextStep, prevStep } = useExperimentWizard()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [filteredPersonas, setFilteredPersonas] = useState<Persona[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    const fetchPersonas = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        toast.error('Failed to load personas')
        return
      }

      setPersonas(data || [])
      setIsLoading(false)
    }

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

  const togglePersona = (persona: Persona) => {
    const isSelected = selectedPersonaIds.includes(persona.id)
    const newIds = isSelected
      ? selectedPersonaIds.filter((id) => id !== persona.id)
      : [...selectedPersonaIds, persona.id]
    updatePersonas(newIds)
  }

  const clearAll = () => {
    updatePersonas([])
  }

  const handlePersonaCreated = (newPersona: Persona) => {
    // Add the new persona to the list
    setPersonas((prev) => [newPersona, ...prev])
    // Auto-select the new persona
    updatePersonas([...selectedPersonaIds, newPersona.id])
    toast.success(`${newPersona.name} has been added and selected`)
  }

  const totalRuns = selectedPersonaIds.length * runsPerPersona
  const estimatedTime = totalRuns * 2 // ~2 minutes per run

  const canContinue = selectedPersonaIds.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Choose Target Personas</h2>
          <p className="text-muted-foreground mt-1">
            Select one or more AI agents to simulate your user base.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-primary">{selectedPersonaIds.length}</span>
          <span className="text-muted-foreground">selected</span>
          {selectedPersonaIds.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search personas..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Device Usage
              </Label>
              <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tech Proficiency
              </Label>
              <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Low / Novice</SelectItem>
                  <SelectItem value="intermediate">Average</SelectItem>
                  <SelectItem value="expert">Advanced / Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Runs per Persona
              </Label>
              <Select
                value={runsPerPersona.toString()}
                onValueChange={(v) => updatePersonas(selectedPersonaIds, parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 run</SelectItem>
                  <SelectItem value="3">3 runs</SelectItem>
                  <SelectItem value="5">5 runs</SelectItem>
                  <SelectItem value="10">10 runs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Runs</span>
              <span className="font-bold">{totalRuns}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Time</span>
              <span className="font-bold">~{estimatedTime} min</span>
            </div>
          </div>
        </div>

        {/* Personas Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-xl border h-72 animate-pulse" />
              ))}
            </div>
          ) : filteredPersonas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  selectable
                  selected={selectedPersonaIds.includes(persona.id)}
                  onSelect={togglePersona}
                />
              ))}
              
              {/* Create New Card */}
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-pointer text-center p-6"
              >
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <h4 className="font-bold">Create New Persona</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Define a custom AI agent
                </p>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border">
              <p className="text-muted-foreground">No personas match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedPersonaIds.length} personas selected
          </span>
          <Button onClick={nextStep} disabled={!canContinue}>
            Continue to Review
          </Button>
        </div>
      </div>

      {/* Create Persona Dialog */}
      <PersonaForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        onSuccess={handlePersonaCreated}
      />
    </div>
  )
}
