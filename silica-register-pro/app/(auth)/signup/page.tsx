'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Shield, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '',
    full_name: '',
    org_name: '',
    abn: '',
  })

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

    // Sign up the user via magic link (OTP)
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        data: {
          full_name: form.full_name,
          org_name: form.org_name,
          abn: form.abn,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?setup=1`,
        shouldCreateUser: true,
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setStep('verify')
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SilicaRegister Pro</span>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verify your email</h2>
            <p className="text-gray-500 text-sm">
              We sent a magic link to <strong>{form.email}</strong>. Click it to create your account and start your free trial.
            </p>
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-sm text-green-800 text-left space-y-2">
              {[
                '14-day free trial — no credit card required',
                'Full access to all Pro features',
                'Setup takes less than 5 minutes',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SilicaRegister Pro</span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Start your free trial</h2>
          <p className="text-sm text-gray-500 mb-6">14 days free. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company / PCBU Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.org_name}
                onChange={e => field('org_name', e.target.value)}
                placeholder="e.g. Apex Construction Pty Ltd"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => field('full_name', e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Work Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => field('email', e.target.value)}
                placeholder="you@company.com.au"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ABN <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.abn}
                onChange={e => field('abn', e.target.value)}
                placeholder="12 345 678 901"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Creating account…' : 'Create Free Account'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By signing up you agree to our{' '}
              <a href="#" className="underline hover:no-underline">Terms</a> and{' '}
              <a href="#" className="underline hover:no-underline">Privacy Policy</a>
            </p>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
