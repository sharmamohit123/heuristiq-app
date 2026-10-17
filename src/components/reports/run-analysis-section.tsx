'use client'

import { useState } from 'react'
import { ExperimentRun, Persona, ExperimentScreenshot, InputMode } from '@/types/database'
import { RunAnalysisCard } from './run-analysis-card'
import { FileText, Search } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RunAnalysisSectionProps {
  runs: (ExperimentRun & { persona?: Persona })[]
  personas: Persona[]
  screenshots?: ExperimentScreenshot[]
  inputMode?: InputMode
}

export function RunAnalysisSection({ 
  runs, 
  personas, 
  screenshots,
  inputMode
}: RunAnalysisSectionProps) {
  const [selectedRunId, setSelectedRunId] = useState<string>(runs[0]?.id || '')

  const selectedRun = runs.find(r => r.id === selectedRunId) || runs[0]
  const selectedPersona = personas.find(p => p.id === selectedRun?.persona_id)

  if (!runs || runs.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Run Analysis: Persona Specifics
        </h2>
        <div className="text-center py-8 bg-muted/50 rounded-lg border">
          <p className="text-sm text-muted-foreground">No run data available.</p>
        </div>
      </section>
    )
  }

  return (
    <section>
      {/* Section Header with Run Selector */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Run Analysis: Persona Specifics
        </h2>
        <div className="relative w-full sm:w-auto min-w-[320px]">
          <Select value={selectedRunId} onValueChange={setSelectedRunId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => {
                const persona = personas.find(p => p.id === run.persona_id)
                return (
                  <SelectItem key={run.id} value={run.id}>
                    Run #{run.run_number}: {persona?.name || 'Unknown Persona'} 
                    {run.success ? ' ✓' : ' ✗'}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Run Analysis Card */}
      {selectedRun && selectedPersona && (
        <RunAnalysisCard
          run={selectedRun}
          persona={selectedPersona}
          screenshots={screenshots}
          inputMode={inputMode}
        />
      )}
    </section>
  )
}
