'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileDown, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { format, subMonths } from 'date-fns'

type GenState = 'idle' | 'loading' | 'done' | 'error'

export default function ReportsPage() {
  const supabase = createClient()
  const [sites, setSites] = useState<any[]>([])
  const [genState, setGenState] = useState<GenState>('idle')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const defaultFrom = format(subMonths(new Date(), 3), 'yyyy-MM-dd')
  const defaultTo   = format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    site_id: '',      // '' = all sites
    date_from: defaultFrom,
    date_to: defaultTo,
  })

  useEffect(() => {
    supabase.from('sites').select('id, name').eq('is_active', true).order('name').then(({ data }) => setSites(data ?? []))
  }, [])

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    setGenState('loading')
    setDownloadUrl(null)
    setErrorMsg('')

    try {
      const params = new URLSearchParams({
        date_from: form.date_from,
        date_to: form.date_to,
        ...(form.site_id ? { site_id: form.site_id } : {}),
      })

      const res = await fetch(`/api/audit-pack?${params.toString()}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setGenState('done')

      // Auto-click download
      const a = document.createElement('a')
      a.href = url
      a.download = `SilicaRegisterPro_AuditPack_${format(new Date(), 'yyyyMMdd')}.pdf`
      a.click()
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to generate audit pack')
      setGenState('error')
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Audit Pack Generator</h1>
        <p className="text-gray-500 mt-1">
          Generate a one-click PDF audit pack for SafeWork inspections. Includes worker register,
          exposure log, fit-test records and monitoring uploads.
        </p>
      </div>

      {/* What's included */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-green-900 mb-3">What's included in the audit pack:</h2>
        <ul className="space-y-1.5 text-sm text-green-800">
          {[
            'Cover page with organisation details and date range',
            'Silica Worker Register — all active workers with fit-test status',
            'Exposure Event Log — all QR check-in and manually logged events',
            'Fit-Test Register — certificates and expiry dates per worker',
            'Air Monitoring Uploads — linked hygienist reports for the period',
          ].map(item => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Configure Report</h2>

        <form onSubmit={generate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Filter</label>
            <select
              value={form.site_id}
              onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All active sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date_from}
                onChange={e => setForm(f => ({ ...f, date_from: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date_to}
                onChange={e => setForm(f => ({ ...f, date_to: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {genState === 'error' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          {genState === 'done' && downloadUrl && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Audit pack generated!</span>
              <a
                href={downloadUrl}
                download={`SilicaRegisterPro_AuditPack_${format(new Date(), 'yyyyMMdd')}.pdf`}
                className="ml-auto font-medium underline hover:no-underline"
              >
                Download again
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={genState === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {genState === 'loading' ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating PDF…
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generate &amp; Download Audit Pack
              </>
            )}
          </button>
        </form>
      </div>

      {/* Compliance note */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Generated pack conforms to SafeWork Australia&apos;s Managing the Risks of Respirable Crystalline Silica
        Code of Practice (2020) record-keeping requirements.
      </p>
    </div>
  )
}
