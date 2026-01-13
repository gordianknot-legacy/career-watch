import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-loaded clients to avoid build-time errors
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables')
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Client for browser/public operations
export const supabase = { get: getSupabaseClient }

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = { get: getSupabaseAdmin }

// Types for our database tables
export interface Subscription {
  id: string
  email: string
  career_urls: string[]
  unsubscribe_token: string
  created_at: string
  last_checked: string | null
  is_active: boolean
}

export interface JobSnapshot {
  id: string
  subscription_id: string
  url: string
  jobs_data: JobListing[]
  checked_at: string
}

export interface JobListing {
  title: string
  url?: string
  location?: string
  department?: string
}

// Database operations
export async function createSubscription(email: string, careerUrls: string[]) {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .insert({
      email,
      career_urls: careerUrls,
    })
    .select()
    .single()

  if (error) throw error
  return data as Subscription
}

export async function getActiveSubscriptions() {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*')
    .eq('is_active', true)

  if (error) throw error
  return data as Subscription[]
}

export async function getSubscriptionByToken(token: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('subscriptions')
    .select('*')
    .eq('unsubscribe_token', token)
    .single()

  if (error) throw error
  return data as Subscription
}

export async function deactivateSubscription(token: string) {
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ is_active: false })
    .eq('unsubscribe_token', token)

  if (error) throw error
}

export async function getLatestSnapshot(subscriptionId: string, url: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('job_snapshots')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .eq('url', url)
    .order('checked_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
  return data as JobSnapshot | null
}

export async function saveSnapshot(subscriptionId: string, url: string, jobs: JobListing[]) {
  const { error } = await getSupabaseAdmin()
    .from('job_snapshots')
    .insert({
      subscription_id: subscriptionId,
      url,
      jobs_data: jobs,
    })

  if (error) throw error
}

export async function updateLastChecked(subscriptionId: string) {
  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ last_checked: new Date().toISOString() })
    .eq('id', subscriptionId)

  if (error) throw error
}
