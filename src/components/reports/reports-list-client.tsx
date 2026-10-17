'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Filter, Plus } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Project } from '@/types/database'
import { ReportListPane } from './report-list-pane'
import { ReportPreviewPane } from './report-preview-pane'

interface ReportsListClientProps {
  experiments: any[]
  projects: Project[]
}

export function ReportsListClient({ experiments, projects }: ReportsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(
    experiments[0]?.id || null
  )
  const [findings, setFindings] = useState<any[]>([])
  const [findingsCounts, setFindingsCounts] = useState<Record<string, number>>({})
  const [isLoadingFindings, setIsLoadingFindings] = useState(false)

  // Fetch findings counts for all experiments
  useEffect(() => {
    const fetchFindingsCounts = async () => {
      const supabase = createClient()
      const counts: Record<string, number> = {}
      
      for (const exp of experiments) {
        const { count } = await supabase
          .from('findings')
          .select('*', { count: 'exact', head: true })
          .eq('experiment_id', exp.id)
        
        counts[exp.id] = count || 0
      }
      
      setFindingsCounts(counts)
    }

    if (experiments.length > 0) {
      fetchFindingsCounts()
    }
  }, [experiments])

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
      e.project?.name?.toLowerCase().includes(query)
    )
  }

  // Fetch findings when selected experiment changes
  useEffect(() => {
    const fetchFindings = async () => {
      if (!selectedExperimentId) {
        setFindings([])
        return
      }

      setIsLoadingFindings(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('findings')
        .select('*')
        .eq('experiment_id', selectedExperimentId)
        .order('frequency', { ascending: false })

      setFindings(data || [])
      setIsLoadingFindings(false)
    }

    fetchFindings()
  }, [selectedExperimentId])

  const selectedExperiment = filteredExperiments.find(e => e.id === selectedExperimentId) || filteredExperiments[0]

  return (
    <>
      {/* Header */}
      <div className="border-b bg-card px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              View and analyze results from your completed UX research experiments.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Filter */}
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48 shadow-sm">
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
                placeholder="Search reports..."
                className="pl-9 w-64 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Pane Content */}
      <div className="flex-1 flex overflow-hidden">
        {filteredExperiments && filteredExperiments.length > 0 ? (
          <>
            {/* Left: Report List */}
            <ReportListPane
              experiments={filteredExperiments}
              selectedId={selectedExperimentId}
              onSelect={setSelectedExperimentId}
              findingsCounts={findingsCounts}
            />

            {/* Right: Report Preview */}
            {selectedExperiment && (
              <ReportPreviewPane
                experiment={selectedExperiment}
                findings={findings}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              {searchQuery || projectFilter !== 'all' ? (
                <>
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-4">
                    No reports match your search criteria. Try adjusting your filters.
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
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete your first experiment to generate a report.
                  </p>
                  <Link href="/experiments">
                    <Button>View Experiments</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
