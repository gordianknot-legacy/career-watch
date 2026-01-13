import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CareerWatch - Job Alert Engine',
  description: 'Get notified when new jobs are posted on your favorite company career pages. Track multiple companies, receive daily email alerts.',
  keywords: ['job alerts', 'career tracking', 'job notifications', 'career page monitor'],
  authors: [{ name: 'WHYBE.AI' }],
  openGraph: {
    title: 'CareerWatch - Job Alert Engine',
    description: 'Get notified when new jobs are posted on your favorite company career pages.',
    url: 'https://careerwatch.whybe.ai',
    siteName: 'CareerWatch',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerWatch - Job Alert Engine',
    description: 'Get notified when new jobs are posted on your favorite company career pages.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
