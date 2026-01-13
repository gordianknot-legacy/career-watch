# CareerWatch

A job alert engine that monitors career pages and sends email notifications when new positions are posted.

## Features

- Track multiple company career pages (up to 10 per subscription)
- Daily automated checks for new job postings
- Email notifications with new job details
- Works with Greenhouse, Lever, Workday, and custom career pages
- One-click unsubscribe

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Styling**: Tailwind CSS
- **Scheduler**: Vercel Cron

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-username/careerwatch.git
cd careerwatch
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the following SQL in the SQL Editor:

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  career_urls TEXT[] NOT NULL,
  unsubscribe_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_checked TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_subscriptions_active ON subscriptions(is_active);

-- Job snapshots table
CREATE TABLE job_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  jobs_data JSONB NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_sub_url ON job_snapshots(subscription_id, url);
```

3. Copy the project URL and keys from Settings > API

### 3. Resend Setup

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain (or use the test domain for development)
3. Create an API key

### 4. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your-api-key
NEXT_PUBLIC_APP_URL=https://careerwatch.whybe.ai
CRON_SECRET=your-random-secret-string
```

### 5. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in project settings
4. Deploy

The cron job (daily at 8 AM UTC) is configured in `vercel.json` and will activate automatically.

### Custom Domain

To use `careerwatch.whybe.ai`:
1. In Vercel project settings, add the custom domain
2. Add a CNAME record in your DNS pointing to `cname.vercel-dns.com`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/careerwatch/subscribe` | POST | Create new subscription |
| `/api/careerwatch/unsubscribe` | GET | Unsubscribe via token |
| `/api/cron/check-jobs` | GET | Trigger job check (cron) |

## License

MIT

---

A [WHYBE.AI](https://whybe.ai) project
