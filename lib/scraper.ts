import * as cheerio from 'cheerio'
import { JobListing } from './supabase'

// Common selectors for job listings across different career page formats
const JOB_SELECTORS = [
  // Greenhouse
  '.opening a',
  '.job-post a',
  '[data-mapped="true"] a',
  // Lever
  '.posting-title',
  '.posting a',
  // Workday
  '[data-automation-id="jobTitle"]',
  '.job-title a',
  // Generic patterns
  '.job-listing a',
  '.job-item a',
  '.career-listing a',
  '.position-listing a',
  '.job a',
  '.careers-list a',
  '.jobs-list a',
  '[class*="job"] a',
  '[class*="position"] a',
  '[class*="career"] a',
  '[class*="opening"] a',
  // Table-based listings
  'table.jobs td a',
  '.job-table a',
  // List items
  'ul.jobs li a',
  'ul.careers li a',
  '.job-listings li a',
]

// Selectors for location info
const LOCATION_SELECTORS = [
  '.location',
  '[class*="location"]',
  '.job-location',
  '.posting-location',
]

// Selectors for department info
const DEPARTMENT_SELECTORS = [
  '.department',
  '[class*="department"]',
  '.team',
  '[class*="team"]',
  '.category',
]

export async function scrapeCareerPage(url: string): Promise<JobListing[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 0 }, // Don't cache
    })

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return []
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    const jobs: JobListing[] = []
    const seenTitles = new Set<string>()

    // Try to extract structured data first (JSON-LD)
    const jsonLdJobs = extractJsonLdJobs($)
    if (jsonLdJobs.length > 0) {
      return jsonLdJobs
    }

    // Try each selector pattern
    for (const selector of JOB_SELECTORS) {
      $(selector).each((_, element) => {
        const $el = $(element)
        const title = cleanJobTitle($el.text())

        if (title && isValidJobTitle(title) && !seenTitles.has(title.toLowerCase())) {
          seenTitles.add(title.toLowerCase())

          const jobUrl = $el.attr('href')
          const absoluteUrl = jobUrl ? resolveUrl(jobUrl, url) : undefined

          // Try to find location and department in parent/sibling elements
          const $parent = $el.closest('[class*="job"], [class*="position"], [class*="opening"], li, tr')
          const location = findTextBySelectors($, $parent, LOCATION_SELECTORS)
          const department = findTextBySelectors($, $parent, DEPARTMENT_SELECTORS)

          jobs.push({
            title,
            url: absoluteUrl,
            location: location || undefined,
            department: department || undefined,
          })
        }
      })

      // If we found jobs with this selector, stop trying others
      if (jobs.length > 0) break
    }

    // Fallback: look for any links with job-related keywords in parent containers
    if (jobs.length === 0) {
      $('a').each((_, element) => {
        const $el = $(element)
        const $parent = $el.parent()
        const parentClass = ($parent.attr('class') || '').toLowerCase()
        const parentId = ($parent.attr('id') || '').toLowerCase()

        const isJobContext =
          parentClass.includes('job') ||
          parentClass.includes('career') ||
          parentClass.includes('position') ||
          parentId.includes('job') ||
          parentId.includes('career')

        if (isJobContext) {
          const title = cleanJobTitle($el.text())
          if (title && isValidJobTitle(title) && !seenTitles.has(title.toLowerCase())) {
            seenTitles.add(title.toLowerCase())
            const jobUrl = $el.attr('href')
            jobs.push({
              title,
              url: jobUrl ? resolveUrl(jobUrl, url) : undefined,
            })
          }
        }
      })
    }

    return jobs
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return []
  }
}

function extractJsonLdJobs($: cheerio.CheerioAPI): JobListing[] {
  const jobs: JobListing[] = []

  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const json = JSON.parse($(element).html() || '')
      const items = Array.isArray(json) ? json : [json]

      for (const item of items) {
        if (item['@type'] === 'JobPosting') {
          jobs.push({
            title: item.title,
            url: item.url,
            location: item.jobLocation?.address?.addressLocality,
            department: item.employmentType,
          })
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  })

  return jobs
}

function cleanJobTitle(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, '')
    .trim()
    .slice(0, 200) // Limit length
}

function isValidJobTitle(title: string): boolean {
  // Filter out navigation links, empty titles, etc.
  if (title.length < 3 || title.length > 150) return false

  const invalidPatterns = [
    /^(home|about|contact|apply|view|see|all|more|back|next|prev|menu|nav)/i,
    /^(sign in|log in|register|subscribe|newsletter)/i,
    /^(privacy|terms|cookies|copyright)/i,
    /^\d+$/, // Just numbers
    /^[^a-zA-Z]+$/, // No letters
  ]

  return !invalidPatterns.some(pattern => pattern.test(title))
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return href
  }
}

function findTextBySelectors(
  $: cheerio.CheerioAPI,
  $context: ReturnType<cheerio.CheerioAPI>,
  selectors: string[]
): string | null {
  for (const selector of selectors) {
    const text = $context.find(selector).first().text().trim()
    if (text) return text
  }
  return null
}

// Compare two job lists and find new jobs
export function findNewJobs(current: JobListing[], previous: JobListing[]): JobListing[] {
  const previousTitles = new Set(previous.map(j => j.title.toLowerCase()))
  return current.filter(job => !previousTitles.has(job.title.toLowerCase()))
}
