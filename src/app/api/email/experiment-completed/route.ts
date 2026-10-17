import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendExperimentCompletedEmail } from '@/lib/email'
import { NotificationPreferences } from '@/types/database'

const DEFAULT_PREFS: NotificationPreferences = {
  experiment_completed_email: true,
  experiment_completed_app: true,
}

export async function POST(request: NextRequest) {
  try {
    const { experimentId } = await request.json()

    if (!experimentId) {
      return NextResponse.json(
        { error: 'Experiment ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user profile for notification preferences
    const { data: profileData } = await supabase
      .from('profiles')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    const prefs: NotificationPreferences = {
      ...DEFAULT_PREFS,
      ...((profileData?.notification_preferences as NotificationPreferences) || {}),
    }

    // Fetch experiment details
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .select('*')
      .eq('id', experimentId)
      .eq('user_id', user.id)
      .single()

    if (experimentError || !experiment) {
      return NextResponse.json(
        { error: 'Experiment not found' },
        { status: 404 }
      )
    }

    // Extract results data
    const results = experiment.results as {
      success_rate?: number
      ux_score?: number
      total_runs?: number
      summary?: string
    } | null

    // Get target URL
    const inputLinks = experiment.input_links as { single?: string; control?: string } | null
    const targetUrl = inputLinks?.single || inputLinks?.control

    // Get user's name from metadata
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'there'

    const uxScore = results?.ux_score || 0
    const successRate = results?.success_rate || 0
    let emailSent = false
    let messageId: string | undefined

    // Send the email (if enabled)
    if (prefs.experiment_completed_email) {
      const emailResult = await sendExperimentCompletedEmail({
        userEmail: user.email!,
        userName,
        experimentName: experiment.name,
        experimentId: experiment.id,
        uxScore,
        successRate,
        totalRuns: results?.total_runs || 0,
        summary: results?.summary,
        targetUrl,
      })

      emailSent = emailResult.success
      messageId = emailResult.messageId

      if (!emailResult.success) {
        console.error('[API] Failed to send experiment completion email:', emailResult.error)
      }
    }

    // Create in-app notification (if enabled)
    let notifCreated = false
    if (prefs.experiment_completed_app) {
      const notificationMessage = `UX Score: ${uxScore}/100 · Success Rate: ${successRate}%${results?.summary ? ` — ${results.summary.slice(0, 120)}` : ''}`

      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'experiment_completed',
          title: `"${experiment.name}" experiment completed`,
          message: notificationMessage,
          data: {
            experimentId: experiment.id,
            experimentName: experiment.name,
            uxScore,
            successRate,
            targetUrl,
          },
        })

      if (notifError) {
        console.error('[API] Failed to create notification:', notifError)
      } else {
        notifCreated = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications processed successfully',
      emailSent,
      notificationCreated: notifCreated,
      messageId,
    })

  } catch (error) {
    console.error('[API] Error sending experiment completion notifications:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
