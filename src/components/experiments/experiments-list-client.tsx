'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExperimentCard } from '@/components/dashboard/experiment-card'
import { Plus, FlaskConical, Search, Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Project } from '@/types/database'

interface ExperimentsListClientProps {
  experiments: any[]
  projects: Project[]
}

export function ExperimentsListClient({ experiments, projects }: ExperimentsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  // Filter experiments
  let filteredExperiments = experiments

  // Filter by project
  if (projectFilter !== 'all') {
    filteredExperiments = filteredExperiments.filter(e => e.project_id === projectFilter)
  }

  // Filter by search
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredExperiments = filteredExperiments.filter(e =>
      e.name.toLowerCase().includes(query) ||
      e.hypothesis?.toLowerCase().includes(query) ||
      e.script?.toLowerCase().includes(query) ||
      e.project?.name?.toLowerCase().includes(query)
    )
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card px-4 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your UX testing experiments.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search experiments..." 
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* New Experiment Button */}
            <Link href="/experiments/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Experiment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-background">
        {filteredExperiments && filteredExperiments.length > 0 ? (
          <>
            {(searchQuery || projectFilter !== 'all') && (
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {filteredExperiments.length} of {experiments.length} experiments
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {filteredExperiments.map((experiment) => (
                <ExperimentCard key={experiment.id} experiment={experiment} />
              ))}
            </div>
          </>
        ) : searchQuery || projectFilter !== 'all' ? (
          <div className="text-center py-16 bg-card rounded-xl border max-w-2xl mx-auto">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No experiments found</h3>
            <p className="text-muted-foreground mb-4">
              No experiments match your search criteria. Try adjusting your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setProjectFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border max-w-2xl mx-auto">
            <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No experiments yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first experiment to start testing with AI personas.
            </p>
            <Link href="/experiments/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Experiment
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
