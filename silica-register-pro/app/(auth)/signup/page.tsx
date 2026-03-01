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

  const navStyle = {
    borderBottom: '1px solid #1f2937',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  }

  const logoIconStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#22c55e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '10px',
    padding: '13px 16px',
    color: '#f9fafb',
    fontSize: '15px',
    outline: 'none',
    marginBottom: '16px',
  }

  if (step === 'verify') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>
        <nav style={navStyle}>
          <div style={logoIconStyle}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>
            SilicaRegister<span style={{ color: '#22c55e' }}> Pro</span>
          </span>
        </nav>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f9fafb', marginBottom: '8px' }}>Verify your email</h2>
            <p style={{ color: '#6b7280', marginBottom: '4px' }}>We sent a magic link to</p>
            <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '28px' }}>{form.email}</p>
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '14px', padding: '24px', textAlign: 'left', marginBottom: '20px' }}>
              {[
                '14-day free trial — no credit card required',
                'Full access to all features from day one',
                'Setup takes less than 5 minutes',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '14px', color: '#d1d5db' }}>
                  <svg width="16" height="16" fill="#22c55e" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#4b5563' }}>Click the link in your email to activate your account</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1f2937', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={logoIconStyle}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>
            SilicaRegister<span style={{ color: '#22c55e' }}> Pro</span>
          </span>
        </div>
        <Link href="/login" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>
          Already have an account? <span style={{ color: '#22c55e', fontWeight: 600 }}>Sign in →</span>
        </Link>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '999px', padding: '4px 12px', marginBottom: '16px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>14-day free trial — no credit card</span>
            </div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#f9fafb', marginBottom: '8px', lineHeight: 1.2 }}>Start managing silica compliance</h1>
            <p style={{ color: '#6b7280', fontSize: '15px' }}>Built for Australian PCBUs. SafeWork audit-ready in minutes.</p>
          </div>

          {/* Card */}
          <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px' }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px', color: '#f87171', fontSize: '14px' }}>
                  <svg width="16" height="16" fill="#f87171" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
                Company / PCBU Name <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="text" value={form.org_name} onChange={e => field('org_name', e.target.value)} placeholder="e.g. Apex Construction Pty Ltd" required style={inputStyle} />

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
                Your Full Name <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="text" value={form.full_name} onChange={e => field('full_name', e.target.value)} placeholder="e.g. Jordan Smith" required style={inputStyle} />

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
                Work Email <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input type="email" value={form.email} onChange={e => field('email', e.target.value)} placeholder="you@company.com.au" required style={inputStyle} />

              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>
                ABN <span style={{ color: '#4b5563', fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" value={form.abn} onChange={e => field('abn', e.target.value)} placeholder="12 345 678 901" style={{ ...inputStyle, marginBottom: '20px' }} />

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#15803d' : '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
              >
                {loading ? 'Creating account…' : 'Create Free Account →'}
              </button>

              <p style={{ fontSize: '12px', color: '#4b5563', textAlign: 'center', marginTop: '14px' }}>
                By signing up you agree to our{' '}
                <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Terms</a>
                {' '}and{' '}
                <a href="#" style={{ color: '#6b7280', textDecoration: 'underline' }}>Privacy Policy</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
