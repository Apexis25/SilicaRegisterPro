'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (authError) { setError(authError.message) } else { setSent(true) }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1f2937', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.3px' }}>
            SilicaRegister<span style={{ color: '#22c55e' }}> Pro</span>
          </span>
        </div>
        <Link href="/signup" style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'none' }}>
          No account? <span style={{ color: '#22c55e', fontWeight: 600 }}>Start free trial →</span>
        </Link>
      </nav>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#f9fafb', marginBottom: '8px' }}>Check your inbox</h2>
              <p style={{ color: '#6b7280', marginBottom: '4px' }}>We sent a magic link to</p>
              <p style={{ color: '#22c55e', fontWeight: 600, marginBottom: '24px' }}>{email}</p>
              <p style={{ fontSize: '13px', color: '#4b5563' }}>Click the link in your email to sign in. No password needed.</p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ marginTop: '24px', background: 'none', border: 'none', color: '#4b5563', fontSize: '13px', cursor: 'pointer' }}
              >
                ← Use a different email
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#f9fafb', marginBottom: '8px', lineHeight: 1.2 }}>Welcome back</h1>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Sign in to your compliance dashboard</p>
              </div>

              {/* Card */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', padding: '32px' }}>
                <form onSubmit={handleMagicLink}>
                  {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px', color: '#f87171', fontSize: '14px' }}>
                      <svg width="16" height="16" fill="#f87171" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  )}

                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#d1d5db', marginBottom: '8px' }}>Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com.au"
                    required
                    autoFocus
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '10px', padding: '13px 16px', color: '#f9fafb', fontSize: '15px', outline: 'none', marginBottom: '20px' }}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '14px', backgroundColor: loading ? '#15803d' : '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1 }}
                  >
                    {loading ? 'Sending…' : 'Send Magic Link'}
                  </button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#4b5563" strokeWidth={2} style={{ flexShrink: 0 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p style={{ fontSize: '12px', color: '#4b5563', margin: 0 }}>No password required. Secure magic link sent to your email.</p>
                </div>
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {['SafeWork Compliant', 'Australian PCBUs', 'Data Encrypted'].map(label => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }}>
                    <svg width="13" height="13" fill="#16a34a" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {label}
                  </span>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6b7280' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Start your free trial</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
  )
}
