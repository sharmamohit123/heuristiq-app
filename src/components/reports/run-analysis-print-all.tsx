import { ExperimentRun, Persona, ExperimentScreenshot } from '@/types/database'
import { RunAnalysisCard } from './run-analysis-card'

interface RunAnalysisPrintAllProps {
  runs: (ExperimentRun & { persona?: Persona })[]
  personas: Persona[]
  screenshots?: ExperimentScreenshot[]
}

export function RunAnalysisPrintAll({ 
  runs, 
  personas, 
  screenshots 
}: RunAnalysisPrintAllProps) {
  if (!runs || runs.length === 0) {
    return null
  }

  return (
    <div className="hidden print:block print-show-all">
      <div className="space-y-8">
        <h2 className="text-lg font-bold mt-8 mb-4">Complete Run Analysis (All Personas)</h2>
        {runs.map((run) => {
          const persona = personas.find(p => p.id === run.persona_id)
          if (!persona) return null
          
          return (
            <div key={run.id} className="page-break-before">
              <h3 className="text-base font-semibold mb-4">
                Run #{run.run_number}: {persona.name}
              </h3>
              <RunAnalysisCard
                run={run}
                persona={persona}
                screenshots={screenshots}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
