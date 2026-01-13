import { NextRequest, NextResponse } from 'next/server'
import {
  getActiveSubscriptions,
  getLatestSnapshot,
  saveSnapshot,
  updateLastChecked,
} from '@/lib/supabase'
import { scrapeCareerPage, findNewJobs } from '@/lib/scraper'
import { sendNewJobsEmail } from '@/lib/email'

// This endpoint is called daily by Vercel Cron
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily job check...')

    const subscriptions = await getActiveSubscriptions()
    console.log(`Found ${subscriptions.length} active subscriptions`)

    let totalNewJobs = 0
    let emailsSent = 0
    const errors: string[] = []

    for (const subscription of subscriptions) {
      try {
        for (const careerUrl of subscription.career_urls) {
          try {
            console.log(`Checking ${careerUrl} for ${subscription.email}`)

            // Scrape current jobs
            const currentJobs = await scrapeCareerPage(careerUrl)
            console.log(`Found ${currentJobs.length} jobs on ${careerUrl}`)

            // Get previous snapshot
            const previousSnapshot = await getLatestSnapshot(subscription.id, careerUrl)
            const previousJobs = previousSnapshot?.jobs_data || []

            // Find new jobs
            const newJobs = findNewJobs(currentJobs, previousJobs)

            if (newJobs.length > 0) {
              console.log(`Found ${newJobs.length} new jobs at ${careerUrl}`)
              totalNewJobs += newJobs.length

              // Send email notification
              await sendNewJobsEmail({
                to: subscription.email,
                companyUrl: careerUrl,
                newJobs,
                unsubscribeToken: subscription.unsubscribe_token,
              })
              emailsSent++
              console.log(`Email sent to ${subscription.email}`)
            }

            // Save new snapshot (even if no new jobs, to track current state)
            await saveSnapshot(subscription.id, careerUrl, currentJobs)
          } catch (urlError) {
            const errorMsg = `Error checking ${careerUrl}: ${urlError}`
            console.error(errorMsg)
            errors.push(errorMsg)
          }

          // Small delay between requests to be respectful
          await sleep(1000)
        }

        // Update last checked timestamp
        await updateLastChecked(subscription.id)
      } catch (subError) {
        const errorMsg = `Error processing subscription ${subscription.id}: ${subError}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    const summary = {
      success: true,
      subscriptionsChecked: subscriptions.length,
      newJobsFound: totalNewJobs,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }

    console.log('Daily job check complete:', summary)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: String(error) },
      { status: 500 }
    )
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
