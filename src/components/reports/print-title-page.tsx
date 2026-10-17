import { Experiment } from '@/types/database'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface PrintTitlePageProps {
  experiment: Experiment & { project?: { name: string } }
  totalRuns: number
  totalPersonas: number
}

export function PrintTitlePage({ experiment, totalRuns, totalPersonas }: PrintTitlePageProps) {
  return (
    <div className="hidden print:block">
      <div className="print-title-page">
        <div className="text-center space-y-6 py-20">
          {/* Logo/Branding */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold">Heuristiq</h3>
            </div>
            <p className="text-sm text-gray-600">AI-Powered UX Research</p>
          </div>

          {/* Report Type Badge */}
          <div className="inline-block">
            <Badge variant="secondary" className="text-xs uppercase tracking-wider px-3 py-1">
              Comprehensive Usability Report
            </Badge>
          </div>

          {/* Experiment Name */}
          <h1 className="text-4xl font-black tracking-tight mt-6">
            {experiment.name}
          </h1>

          {/* Metadata */}
          <div className="text-gray-600 space-y-2 mt-8">
            <p><strong>Project:</strong> {experiment.project?.name || 'N/A'}</p>
            <p><strong>Experiment Type:</strong> {experiment.type === 'usability' ? 'Usability Experiment' : 'A/B Experiment'}</p>
            <p><strong>Experiment Runs:</strong> {totalRuns} across {totalPersonas} AI personas</p>
            {experiment.completed_at && (
              <p><strong>Completed:</strong> {format(new Date(experiment.completed_at), 'MMMM dd, yyyy')}</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-16 text-xs text-gray-500 border-t pt-6 inline-block px-12">
            <p>Report generated on {format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</p>
            <p className="mt-1">Experiment ID: {experiment.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
