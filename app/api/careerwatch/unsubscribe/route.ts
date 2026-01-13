import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionByToken, deactivateSubscription } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return new NextResponse(renderHtml('Invalid Link', 'The unsubscribe link is invalid or expired.', false), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Verify token exists
    const subscription = await getSubscriptionByToken(token)

    if (!subscription) {
      return new NextResponse(renderHtml('Not Found', 'This subscription was not found or has already been removed.', false), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (!subscription.is_active) {
      return new NextResponse(renderHtml('Already Unsubscribed', 'You have already been unsubscribed from these alerts.', true), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Deactivate subscription
    await deactivateSubscription(token)

    return new NextResponse(renderHtml('Unsubscribed', 'You have been successfully unsubscribed from CareerWatch alerts.', true), {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return new NextResponse(renderHtml('Error', 'Something went wrong. Please try again later.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function renderHtml(title: string, message: string, success: boolean): string {
  const icon = success
    ? '<svg style="width: 48px; height: 48px; color: #84cc16;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
    : '<svg style="width: 48px; height: 48px; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - CareerWatch</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #0a0a0b;
      color: #fafafa;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 400px;
      text-align: center;
      background: #18181b;
      padding: 40px;
      border-radius: 16px;
      border: 1px solid #27272a;
    }
    .icon { margin-bottom: 20px; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { color: #a1a1aa; margin: 0 0 24px; }
    a {
      display: inline-block;
      color: #84cc16;
      text-decoration: none;
      padding: 12px 24px;
      border: 1px solid #84cc16;
      border-radius: 8px;
      transition: all 0.2s;
    }
    a:hover {
      background: #84cc16;
      color: #0a0a0b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Back to CareerWatch</a>
  </div>
</body>
</html>
`
}
