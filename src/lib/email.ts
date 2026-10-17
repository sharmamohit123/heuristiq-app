/**
 * Email Service Module
 * 
 * Handles sending transactional emails via Resend API.
 */

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (!resendApiKey) {
    console.warn('[Email] RESEND_API_KEY not configured, skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  // Use RESEND_FROM_EMAIL env var, or fallback to Resend's testing domain
  // Once your domain is verified on Resend, set RESEND_FROM_EMAIL=Heuristiq <hello@heuristiq.com>
  const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'Heuristiq <onboarding@resend.dev>'

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('[Email] Resend API error:', errorData)
      return { success: false, error: errorData.message || 'Failed to send email' }
    }

    const data = await response.json()
    console.log('[Email] Email sent successfully:', data.id)
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('[Email] Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Email templates
 */
export const emailTemplates = {
  experimentCompleted: (data: {
    userName: string
    experimentName: string
    experimentId: string
    uxScore: number
    successRate: number
    totalRuns: number
    summary?: string
    targetUrl?: string
    appUrl: string
  }) => {
    const reportUrl = `${data.appUrl}/experiments/${data.experimentId}/report`
    const scoreColor = data.uxScore >= 80 ? '#22c55e' : data.uxScore >= 60 ? '#eab308' : '#ef4444'
    const successRateColor = data.successRate >= 80 ? '#22c55e' : data.successRate >= 60 ? '#eab308' : '#ef4444'
    
    return {
      subject: `✅ Your experiment "${data.experimentName}" is complete!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: 700; color: #0ea5e9; letter-spacing: -0.5px;">Heuristiq</span>
    </div>
    
    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Success Icon -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 32px; line-height: 64px;">✓</span>
        </div>
      </div>
      
      <!-- Title -->
      <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; text-align: center; color: #18181b;">
        Experiment Complete!
      </h1>
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #71717a; text-align: center;">
        Hi ${data.userName}, your AI-powered usability test has finished running.
      </p>
      
      <!-- Experiment Name -->
      <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">Experiment</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #18181b;">${data.experimentName}</p>
        ${data.targetUrl ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #71717a;">Target: ${data.targetUrl}</p>` : ''}
      </div>
      
      <!-- Results Grid -->
      <div style="display: table; width: 100%; margin-bottom: 24px;">
        <div style="display: table-row;">
          <div style="display: table-cell; width: 33%; text-align: center; padding: 16px; background: #fafafa; border-radius: 12px 0 0 12px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #71717a;">UX Score</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${scoreColor};">${data.uxScore}</p>
          </div>
          <div style="display: table-cell; width: 33%; text-align: center; padding: 16px; background: #fafafa;">
            <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #71717a;">Success Rate</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: ${successRateColor};">${Math.round(data.successRate)}%</p>
          </div>
          <div style="display: table-cell; width: 33%; text-align: center; padding: 16px; background: #fafafa; border-radius: 0 12px 12px 0;">
            <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; color: #71717a;">Total Runs</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; color: #0ea5e9;">${data.totalRuns}</p>
          </div>
        </div>
      </div>
      
      ${data.summary ? `
      <!-- Summary -->
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #18181b;">Summary</p>
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #52525b;">${data.summary}</p>
      </div>
      ` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="${reportUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          View Full Report →
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: #71717a;">
        Need help understanding your results?
      </p>
      <a href="mailto:support@heuristiq.co.in" style="font-size: 14px; color: #0ea5e9; text-decoration: none;">
        Contact our team →
      </a>
      <p style="margin: 24px 0 0 0; font-size: 12px; color: #a1a1aa;">
        © ${new Date().getFullYear()} Heuristiq. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    }
  },
}

/**
 * Send experiment completion email
 */
export async function sendExperimentCompletedEmail(data: {
  userEmail: string
  userName: string
  experimentName: string
  experimentId: string
  uxScore: number
  successRate: number
  totalRuns: number
  summary?: string
  targetUrl?: string
}): Promise<EmailResult> {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://heuristiq.co.in'
  
  const template = emailTemplates.experimentCompleted({
    ...data,
    appUrl,
  })

  return sendEmail({
    to: data.userEmail,
    subject: template.subject,
    html: template.html,
    // from will use RESEND_FROM_EMAIL env var or fallback to Resend testing domain
  })
}
