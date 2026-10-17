import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { aggregateFindings } from '@/lib/ai'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: experimentId } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch experiment
    const { data: experiment, error: expError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .eq('user_id', user.id)
      .single()

    if (expError || !experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    if (experiment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only re-aggregate completed experiments' },
        { status: 400 }
      )
    }

    // Fetch all runs
    const { data: runs, error: runsError } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('experiment_id', experimentId)

    if (runsError || !runs) {
      return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
    }

    // Fetch personas
    const { data: expPersonas } = await supabase
      .from('experiment_personas')
      .select('persona_id')
      .eq('experiment_id', experimentId)

    const personaIds = expPersonas?.map((ep) => ep.persona_id) || []
    const { data: personas } = await supabase
      .from('personas')
      .select('*')
      .in('id', personaIds)

    if (!personas) {
      return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 })
    }

    console.log('========================================')
    console.log('[Re-aggregate] Starting for experiment:', experimentId)
    console.log('[Re-aggregate] Runs:', runs.length, 'Personas:', personas.length)

    // Run aggregation
    const aggregated = await aggregateFindings(runs, personas)

    console.log('========================================')
    console.log('[Re-aggregate] Aggregation complete!')
    console.log('[Re-aggregate] Findings (issues) generated:', aggregated.findings.length)
    console.log('[Re-aggregate] Positive findings generated:', aggregated.positiveFindings?.length || 0)
    console.log('[Re-aggregate] Recommendations generated:', aggregated.recommendations?.length || 0)
    console.log('[Re-aggregate] UX Score:', aggregated.ux_score)
    
    // Log all findings being saved
    console.log('[Re-aggregate] Findings to save to database:')
    aggregated.findings.forEach((f, idx) => {
      console.log(`  ${idx + 1}. ${f.title} [${f.confidence}] (${f.frequency}x)`)
    })

    // Delete existing findings
    const { error: deleteError } = await supabase
      .from('findings')
      .delete()
      .eq('experiment_id', experimentId)

    if (deleteError) {
      console.error('[Re-aggregate] Error deleting old findings:', deleteError)
    } else {
      console.log('[Re-aggregate] Deleted old findings')
    }

    // Save new findings
    if (aggregated.findings && aggregated.findings.length > 0) {
      console.log('[Re-aggregate] Inserting', aggregated.findings.length, 'new findings...')
      
      // Prepare findings data (backward compatible with/without severity column)
      const findingsToInsert = aggregated.findings.map((finding) => {
        const data: any = {
          experiment_id: experimentId,
          title: finding.title,
          explanation: finding.explanation,
          suggested_fix: finding.suggested_fix,
          confidence: finding.confidence,
          frequency: finding.frequency,
        }
        
        // Add severity if it exists
        if ((finding as any).severity) {
          data.severity = (finding as any).severity
        }
        
        return data
      })

      const { data: insertedFindings, error: findingsError } = await supabase
        .from('findings')
        .insert(findingsToInsert)
        .select()

      if (findingsError) {
        console.error('[Re-aggregate] Error saving findings:', findingsError)
      } else {
        console.log('[Re-aggregate] Successfully saved', insertedFindings?.length || 0, 'findings to database')
      }
    } else {
      console.log('[Re-aggregate] No findings to save')
    }

    // Update experiment results (including new positiveFindings)
    const { error: updateError } = await supabase
      .from('experiments')
      .update({
        results: {
          success_rate: aggregated.success_rate,
          avg_duration_ms: aggregated.avg_duration_ms,
          ux_score: aggregated.ux_score,
          total_runs: runs.length,
          total_failures: runs.filter((r) => !r.success).length,
          summary: aggregated.summary,
          recommendations: aggregated.recommendations,
          positiveFindings: aggregated.positiveFindings,
        },
      })
      .eq('id', experimentId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update results' }, { status: 500 })
    }

    console.log('[Re-aggregate] SUCCESS! Returning response')
    console.log('========================================')

    return NextResponse.json({
      success: true,
      findings: aggregated.findings.length,
      recommendations: aggregated.recommendations?.length || 0,
      ux_score: aggregated.ux_score,
      summary: aggregated.summary?.substring(0, 100),
    })
  } catch (error) {
    console.error('[Re-aggregate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to re-aggregate' },
      { status: 500 }
    )
  }
}
