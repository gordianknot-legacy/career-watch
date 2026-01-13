import { Resend } from 'resend'
import { JobListing } from './supabase'

// Lazy-loaded Resend client
let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY environment variable')
    }
    _resend = new Resend(apiKey)
  }
  return _resend
}

interface NewJobsEmailParams {
  to: string
  companyUrl: string
  newJobs: JobListing[]
  unsubscribeToken: string
}

export async function sendNewJobsEmail({ to, companyUrl, newJobs, unsubscribeToken }: NewJobsEmailParams) {
  const companyName = extractCompanyName(companyUrl)
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://careerwatch.whybe.ai'}/api/careerwatch/unsubscribe?token=${unsubscribeToken}`

  const jobListHtml = newJobs
    .map(job => {
      const jobLink = job.url
        ? `<a href="${job.url}" style="color: #84cc16; text-decoration: none;">${job.title}</a>`
        : job.title
      const location = job.location ? ` - ${job.location}` : ''
      const dept = job.department ? ` (${job.department})` : ''
      return `<li style="margin-bottom: 8px;">${jobLink}${location}${dept}</li>`
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background-color: #0a0a0b; color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 16px; padding: 32px; border: 1px solid #27272a;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #84cc16; margin: 0; font-size: 24px;">CareerWatch</h1>
      <p style="color: #71717a; margin: 8px 0 0 0; font-size: 14px;">New Job Alert</p>
    </div>

    <div style="background-color: #27272a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #fafafa;">
        ${newJobs.length} new position${newJobs.length > 1 ? 's' : ''} at ${companyName}
      </h2>
      <ul style="margin: 0; padding-left: 20px; color: #d4d4d8;">
        ${jobListHtml}
      </ul>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${companyUrl}" style="display: inline-block; background-color: #84cc16; color: #0a0a0b; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Career Page
      </a>
    </div>

    <div style="border-top: 1px solid #27272a; padding-top: 20px; text-align: center;">
      <p style="color: #71717a; font-size: 12px; margin: 0;">
        You're receiving this because you subscribed to job alerts for this company.
        <br><br>
        <a href="${unsubscribeUrl}" style="color: #71717a; text-decoration: underline;">Unsubscribe from these alerts</a>
      </p>
    </div>
  </div>
</body>
</html>
`

  const { error } = await getResend().emails.send({
    from: 'CareerWatch <alerts@whybe.ai>',
    to,
    subject: `${newJobs.length} new job${newJobs.length > 1 ? 's' : ''} at ${companyName}`,
    html,
  })

  if (error) throw error
}

function extractCompanyName(url: string): string {
  try {
    const hostname = new URL(url).hostname
    // Remove www. and common TLDs, capitalize first letter
    const name = hostname
      .replace(/^www\./, '')
      .replace(/\.(com|org|net|io|ai|co|jobs).*$/, '')
      .split('.')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Company'
  }
}
