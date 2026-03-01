'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', full_name: '', org_name: '', abn: '' })

  function field(key: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.full_name || !form.org_name) {
      setError('Email, name and company name are required.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        data: { full_name: form.full_name, org_name: form.org_name, abn: form.abn },
        emailRedirectTo: `${window.location.origin}/auth/callback?setup=1`,
        shouldCreateUser: true,
      },
    })
    setLoading(false)
    if (authError) { setError(authError.message) } else { setStep('verify') }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <nav className="border-b border-gray-800 px-8 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SilicaRegister<span className="text-green-400"> Pro</span></span>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verify your email</h2>
            <p className="text-gray-400 mb-1">We sent a magic link to</p>
            <p className="text-green-400 font-medium mb-8">{form.email}</p>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left space-y-3 mb-6">
              {[
                '14-day free trial — no credit card required',
                'Full access to all features from day one',
                'Setup takes less than 5 minutes',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600">Click the link in your email to activate your account</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">SilicaRegister<span className="text-green-400"> Pro</span></span>
        </div>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
          Already have an account? <span className="text-green-400 font-medium">Sign in →</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              <span className="text-xs text-green-400 font-medium">14-day free trial — no credit card</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Start managing silica compliance</h1>
            <p className="text-gray-400">Built for Australian PCBUs. SafeWork audit-ready in minutes.</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company / PCBU Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.org_name}
                  onChange={e => field('org_name', e.target.value)}
                  placeholder="e.g. Apex Construction Pty Ltd"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => field('full_name', e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => field('email', e.target.value)}
                  placeholder="you@company.com.au"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ABN <span className="text-gray-600 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.abn}
                  onChange={e => field('abn', e.target.value)}
                  placeholder="12 345 678 901"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-semibold py-3 rounded-xl text-sm transition-all mt-2"
              >
                {loading ? 'Creating account…' : 'Create Free Account →'}
              </button>

              <p className="text-xs text-gray-600 text-center pt-1">
                By signing up you agree to our{' '}
                <a href="#" className="text-gray-500 hover:text-gray-300 underline">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-gray-500 hover:text-gray-300 underline">Privacy Policy</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
