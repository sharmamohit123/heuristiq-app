import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If RESEND_API_KEY is configured, use Resend
    const resendApiKey = process.env.RESEND_API_KEY
    
    if (resendApiKey) {
      try {
        // Use verified domain email or Resend's default for testing
        // In production, use your verified domain email
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: ['hello@heuristiq.co.in'],
            subject: `[Heuristiq Contact] New message from ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0ea5e9;">New Contact Form Submission</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Message:</strong></p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 10px;">
                  <p style="margin: 0; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
                </div>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                <p style="color: #6b7280; font-size: 12px;">
                  This message was sent from the Heuristiq contact form.
                </p>
              </div>
            `,
            reply_to: email,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Resend API error:', errorData)
          // Don't throw, fall through to success with mailto fallback
          throw new Error(errorData.message || 'Failed to send email via Resend')
        }

        // Email sent successfully via Resend
        return NextResponse.json({ 
          success: true, 
          message: 'Email sent successfully! We\'ll get back to you soon.' 
        })
        
      } catch (resendError) {
        console.error('Resend error:', resendError)
        // Fall through to mailto fallback
      }
    }

    // Fallback: Return mailto link for client-side
    console.log('Contact form submission (fallback):', { name, email, message })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Message received! We will get back to you soon.',
      // Include mailto link for client-side fallback
      mailtoLink: `mailto:hello@heuristiq.co.in?subject=${encodeURIComponent(`Contact from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
