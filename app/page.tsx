'use client'

import { useState } from 'react'
import { Mail, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink, Bell, Sparkles } from 'lucide-react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [careerUrls, setCareerUrls] = useState([''])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const addUrlField = () => {
    if (careerUrls.length < 10) {
      setCareerUrls([...careerUrls, ''])
    }
  }

  const removeUrlField = (index: number) => {
    if (careerUrls.length > 1) {
      setCareerUrls(careerUrls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...careerUrls]
    newUrls[index] = value
    setCareerUrls(newUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus(null)

    const validUrls = careerUrls.filter(url => url.trim() !== '')

    if (validUrls.length === 0) {
      setStatus({ type: 'error', message: 'Please enter at least one career page URL' })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/careerwatch/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, careerUrls: validUrls }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ type: 'success', message: data.message })
        setEmail('')
        setCareerUrls([''])
      } else {
        setStatus({ type: 'error', message: data.error })
      }
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="https://whybe.ai" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
            <span className="text-sm">← whybe.ai</span>
          </a>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20">
            <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
            <span className="text-xs text-lime-500">Active</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <Bell className="w-4 h-4 text-lime-500" />
              <span className="text-sm text-white/70">Job Alert Engine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                CareerWatch
              </span>
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Never miss a job opportunity. Get notified when companies you care about post new roles.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-16">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-lime-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Smart Parsing</h3>
              <p className="text-sm text-white/50">Works with Greenhouse, Lever, Workday, and custom career pages.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Daily Alerts</h3>
              <p className="text-sm text-white/50">Pages checked daily. Email sent only when new jobs appear.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5 text-teal-500" />
              </div>
              <h3 className="font-semibold text-white mb-2">Multi-Company</h3>
              <p className="text-sm text-white/50">Track up to 10 different career pages with one subscription.</p>
            </div>
          </div>

          {/* Subscription Form */}
          <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/10 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Start Watching</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Your Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Career URLs */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Career Page URLs
                  </label>
                  <div className="space-y-3">
                    {careerUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => updateUrl(index, e.target.value)}
                            placeholder="https://company.com/careers"
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all"
                          />
                        </div>
                        {careerUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUrlField(index)}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-red-400 hover:border-red-400/50 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {careerUrls.length < 10 && (
                    <button
                      type="button"
                      onClick={addUrlField}
                      className="mt-3 flex items-center gap-2 text-sm text-lime-500 hover:text-lime-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add another career page
                    </button>
                  )}
                </div>

                {/* Status Message */}
                {status && (
                  <div
                    className={`flex items-center gap-3 p-4 rounded-xl ${
                      status.type === 'success'
                        ? 'bg-lime-500/10 border border-lime-500/20 text-lime-500'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {status.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{status.message}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-semibold hover:from-lime-400 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <Bell className="w-5 h-5" />
                      Start Watching
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-white/40">
                Free forever. Unsubscribe anytime. No spam, ever.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            A <a href="https://whybe.ai" className="text-lime-500 hover:text-lime-400">WHYBE.AI</a> project
          </p>
          <p className="text-sm text-white/40">
            Built with curiosity
          </p>
        </div>
      </footer>
    </div>
  )
}
