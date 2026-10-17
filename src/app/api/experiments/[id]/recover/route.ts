import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: experimentId } = await params
    const supabase = await createClient()

    // Get experiment
    const { data: experiment } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .single()

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    // Get all runs for this experiment
    const { data: runs } = await supabase
      .from('experiment_runs')
      .select('*')
      .eq('experiment_id', experimentId)

    // If experiment is "running" but has no recent activity, it's stuck
    // Mark it as failed so user can restart
    if (experiment.status === 'running') {
      await supabase
        .from('experiments')
        .update({ status: 'failed' })
        .eq('id', experimentId)

      return NextResponse.json({
        success: true,
        message: 'Experiment marked as failed. You can restart it.',
        runsCompleted: runs?.length || 0
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Experiment is not stuck'
    })
  } catch (error) {
    console.error('Recovery error:', error)
    return NextResponse.json(
      { error: 'Failed to recover experiment' },
      { status: 500 }
    )
  }
}
