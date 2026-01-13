import { NextRequest, NextResponse } from 'next/server'
import { createSubscription } from '@/lib/supabase'
import { scrapeCareerPage } from '@/lib/scraper'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, careerUrls } = body

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate career URLs
    if (!careerUrls || !Array.isArray(careerUrls) || careerUrls.length === 0) {
      return NextResponse.json(
        { error: 'Please provide at least one career page URL' },
        { status: 400 }
      )
    }

    // Validate and clean URLs
    const validUrls: string[] = []
    for (const url of careerUrls) {
      if (!isValidUrl(url)) {
        return NextResponse.json(
          { error: `Invalid URL: ${url}` },
          { status: 400 }
        )
      }
      validUrls.push(normalizeUrl(url))
    }

    // Limit number of URLs per subscription
    if (validUrls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 career pages per subscription' },
        { status: 400 }
      )
    }

    // Verify at least one URL is accessible (quick check)
    const testUrl = validUrls[0]
    const testJobs = await scrapeCareerPage(testUrl)
    if (testJobs.length === 0) {
      // URL might still be valid, just no jobs found - that's okay
      console.log(`No jobs found on initial check for ${testUrl}, but proceeding`)
    }

    // Create subscription
    const subscription = await createSubscription(email, validUrls)

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed! You'll receive alerts for ${validUrls.length} career page${validUrls.length > 1 ? 's' : ''}.`,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription. Please try again.' },
      { status: 500 }
    )
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Ensure https
    parsed.protocol = 'https:'
    // Remove trailing slash
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}
