import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is designed to be called by a cron job to clean up expired recordings
// Triggered daily by Cloud Scheduler (see deploy/deploy.sh)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date().toISOString()

    // Find all experiment runs with expired recordings
    const { data: expiredRuns, error: queryError } = await supabase
      .from('experiment_runs')
      .select('id, recording_url, interaction_screenshots')
      .lt('recording_expires_at', now)
      .not('recording_url', 'is', null)

    if (queryError) {
      console.error('[cleanup-recordings] Query error:', queryError)
      return NextResponse.json(
        { error: 'Failed to query expired recordings', details: queryError.message },
        { status: 500 }
      )
    }

    if (!expiredRuns || expiredRuns.length === 0) {
      return NextResponse.json({
        message: 'No expired recordings to clean up',
        deletedCount: 0,
      })
    }

    console.log(`[cleanup-recordings] Found ${expiredRuns.length} expired recordings`)

    let deletedRecordings = 0
    const errors: string[] = []

    for (const run of expiredRuns) {
      // Delete recording (.webm video) from storage - keep screenshots for reports
      if (run.recording_url) {
        try {
          // Extract storage path from URL
          const urlParts = run.recording_url.split('/experiment-recordings/')
          if (urlParts.length > 1) {
            const storagePath = urlParts[1]
            const { error: deleteError } = await supabase.storage
              .from('experiment-recordings')
              .remove([storagePath])

            if (deleteError) {
              errors.push(`Failed to delete recording for run ${run.id}: ${deleteError.message}`)
            } else {
              deletedRecordings++
              console.log(`[cleanup-recordings] Deleted recording: ${storagePath}`)
            }
          }
        } catch (e) {
          errors.push(`Error processing recording for run ${run.id}: ${e}`)
        }
      }

      // Note: We intentionally keep interaction_screenshots for historical reports
      // Only the video recording is deleted after expiry

      // Update the run to clear only recording fields (keep screenshots)
      const { error: updateError } = await supabase
        .from('experiment_runs')
        .update({
          recording_url: null,
          recording_expires_at: null,
          // interaction_screenshots are kept for report viewing
        })
        .eq('id', run.id)

      if (updateError) {
        errors.push(`Failed to update run ${run.id}: ${updateError.message}`)
      }
    }

    const response = {
      message: 'Cleanup completed - recordings deleted, screenshots preserved',
      processedRuns: expiredRuns.length,
      deletedRecordings,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log('[cleanup-recordings] Cleanup result:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[cleanup-recordings] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST endpoint for manual trigger (with authentication)
export async function POST(request: NextRequest) {
  // Same logic as GET but can include additional parameters
  return GET(request)
}
