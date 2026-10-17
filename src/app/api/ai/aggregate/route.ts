import { NextRequest, NextResponse } from 'next/server'
import { aggregateFindings } from '@/lib/ai'
import { ExperimentRun, Persona } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { runs, personas } = body as {
      runs: ExperimentRun[]
      personas: Persona[]
    }

    if (!runs || !personas) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('========================================')
    console.log('[API /ai/aggregate] REQUEST RECEIVED')
    console.log('[API /ai/aggregate] Runs:', runs.length)
    console.log('[API /ai/aggregate] Personas:', personas.length)
    
    // Log insights from each run
    runs.forEach((run, idx) => {
      const logsData = run.logs as any
      console.log(`[API /ai/aggregate] Run #${idx + 1} has ${logsData?.insights?.length || 0} insights, ${logsData?.recommendations?.length || 0} recommendations`)
    })

    const result = await aggregateFindings(runs, personas)

    console.log('========================================')
    console.log('[API /ai/aggregate] RESPONSE SENDING')
    console.log('[API /ai/aggregate] Findings (issues):', result.findings.length)
    console.log('[API /ai/aggregate] Positive Findings:', result.positiveFindings?.length || 0)
    console.log('[API /ai/aggregate] Recommendations:', result.recommendations?.length || 0)
    console.log('[API /ai/aggregate] UX Score:', result.ux_score)
    console.log('[API /ai/aggregate] Summary length:', result.summary?.length || 0)
    console.log('========================================')

    return NextResponse.json(result)
  } catch (error) {
    console.error('AI aggregation error:', error)
    return NextResponse.json(
      { error: 'Failed to aggregate findings' },
      { status: 500 }
    )
  }
}
