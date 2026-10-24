/**
 * Resend Email Service
 *
 * Handles email sending via Resend API
 */

import { Resend } from 'resend'
import { logger } from '@/lib/logger'

// Lazy-load Resend client to avoid initialization errors when API key is not set
let resend: Resend | null = null

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }

  return resend
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { to, subject, html, from = 'Veritas AI <noreply@veritasai.com>' } = options

    const client = getResendClient()
    const data = await client.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    logger.info('Email sent successfully', {
      to: Array.isArray(to) ? to : [to],
      subject,
      messageId: data.id
    })

    return { success: true, data }
  } catch (error) {
    logger.error('Failed to send email', {
      error: error instanceof Error ? error.message : String(error),
      to: options.to,
      subject: options.subject
    })

    throw error
  }
}

/**
 * Send pilot application confirmation email to applicant
 */
export async function sendPilotConfirmationEmail(data: {
  firstName: string
  lastName: string
  email: string
  companyName: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pilot Application Received - Veritas AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-weight: bold; font-size: 20px;">V</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0;">
              <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 600; color: #111827; line-height: 1.2;">
                Thanks for applying, ${data.firstName}!
              </h1>

              <p style="margin: 0 0 24px 0; font-size: 18px; color: #6B7280; line-height: 1.6;">
                We've received your pilot application for <strong style="color: #111827;">${data.companyName}</strong>.
              </p>

              <div style="background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); border-radius: 16px; padding: 32px; margin: 32px 0;">
                <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: white;">
                  What happens next?
                </h2>

                <div style="margin: 24px 0 0 0;">
                  <div style="display: flex; margin-bottom: 20px;">
                    <div style="color: white; font-size: 24px; margin-right: 16px; width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                    <div>
                      <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: white;">Review</h3>
                      <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">Our team reviews your application (1-2 business days)</p>
                    </div>
                  </div>

                  <div style="display: flex; margin-bottom: 20px;">
                    <div style="color: white; font-size: 24px; margin-right: 16px; width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                    <div>
                      <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: white;">Discovery Call</h3>
                      <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">30-minute call to discuss your quality challenges</p>
                    </div>
                  </div>

                  <div style="display: flex;">
                    <div style="color: white; font-size: 24px; margin-right: 16px; width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                    <div>
                      <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 600; color: white;">Launch Pilot</h3>
                      <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">8-week pilot program with full API access</p>
                    </div>
                  </div>
                </div>
              </div>

              <p style="margin: 24px 0 8px 0; font-size: 16px; color: #111827; line-height: 1.6;">
                In the meantime, explore our live demo:
              </p>

              <a href="https://veritasai.com/dashboard" style="display: inline-block; margin: 16px 0 32px 0; padding: 14px 28px; background: #111827; color: white; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 600;">
                View Dashboard
              </a>

              <div style="border-top: 1px solid #E5E7EB; padding-top: 24px; margin-top: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6B7280;">
                  Have questions? Email us at <a href="mailto:pilot@veritasai.com" style="color: #7C3AED; text-decoration: none;">pilot@veritasai.com</a>
                </p>
                <p style="margin: 0; font-size: 14px; color: #9CA3AF;">
                  © 2026 Veritas AI Inc. All rights reserved.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  return sendEmail({
    to: data.email,
    subject: `Your Veritas AI Pilot Application - Next Steps`,
    html,
    from: 'Veritas AI Pilot Team <pilot@veritasai.com>'
  })
}

/**
 * Send pilot application notification to admin
 */
export async function sendPilotAdminNotification(data: {
  firstName: string
  lastName: string
  email: string
  companyName: string
  productCount?: string
  reviewCount?: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Pilot Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; padding: 20px;">
    <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 24px;">
      🎯 New Pilot Application
    </h1>

    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px 0;">
        Company Details
      </h2>
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #6B7280; width: 140px;">Company Name:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${data.companyName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Contact Name:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${data.firstName} ${data.lastName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #7C3AED; text-decoration: none;">${data.email}</a></td>
        </tr>
        ${data.productCount ? `
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Product Count:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${data.productCount} products</td>
        </tr>
        ` : ''}
        ${data.reviewCount ? `
        <tr>
          <td style="padding: 8px 0; color: #6B7280;">Review Count:</td>
          <td style="padding: 8px 0; color: #111827; font-weight: 500;">${data.reviewCount} reviews</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="font-size: 14px; color: #6B7280; margin: 24px 0 0 0;">
      Submitted: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
    </p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: 'pilot@veritasai.com', // Replace with your admin email
    subject: `🎯 New Pilot Application: ${data.companyName}`,
    html,
  })
}
