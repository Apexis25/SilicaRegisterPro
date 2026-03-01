'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Upload } from 'lucide-react'

const RPE_TYPES = [
  'P2 disposable half-face respirator',
  'P2 reusable half-face respirator',
  'Full-face P3 respirator',
  'PAPR (powered air-purifying)',
  'Supplied air respirator',
]

export default function NewFitTestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedWorker = searchParams.get('worker') ?? ''

  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    worker_id: preselectedWorker,
    rpe_type: '',
    rpe_model: '',
    test_date: '',
    fit_factor: '',
    result: 'pass',
    provider: '',
    next_due_date: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('workers')
      .select('id, full_name, role_trade')
      .eq('is_active', true)
      .order('full_name')
      .then(({ data }) => setWorkers(data ?? []))
  }, [])

  // Auto-set next_due_date to 2 years after test_date
  useEffect(() => {
    if (form.test_date && !form.next_due_date) {
      const d = new Date(form.test_date)
      d.setFullYear(d.getFullYear() + 2)
      setForm(f => ({ ...f, next_due_date: d.toISOString().split('T')[0] }))
    }
  }, [form.test_date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.worker_id || !form.rpe_type || !form.test_date) {
      setError('Worker, RPE type and test date are required.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    let certificateUrl: string | null = null

    // Upload certificate if provided
    if (certificateFile) {
      setUploading(true)
      const ext = certificateFile.name.split('.').pop()
      const path = `fit-tests/${form.worker_id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(path, certificateFile)
      setUploading(false)

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(uploadData.path)
      certificateUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('fit_tests').insert({
      worker_id: form.worker_id,
      rpe_type: form.rpe_type,
      rpe_model: form.rpe_model || null,
      test_date: form.test_date,
      fit_factor: form.fit_factor ? parseFloat(form.fit_factor) : null,
      result: form.result as any,
      provider: form.provider || null,
      next_due_date: form.next_due_date || null,
      certificate_url: certificateUrl,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/fit-tests')
    router.refresh()
  }

  const field = (key: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/fit-tests" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Fit Tests
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Fit-Test Record</h1>
        <p className="text-gray-500 mt-1">Record an RPE fit-test result for a worker</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Worker <span className="text-red-500">*</span>
          </label>
          <select
            value={form.worker_id}
            onChange={e => field('worker_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select worker…</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>{w.full_name} — {w.role_trade}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RPE Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.rpe_type}
              onChange={e => field('rpe_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select type…</option>
              {RPE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RPE Model / Brand</label>
            <input
              type="text"
              value={form.rpe_model}
              onChange={e => field('rpe_model', e.target.value)}
              placeholder="e.g. 3M 7502"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.test_date}
              onChange={e => field('test_date', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fit Factor</label>
            <input
              type="number"
              value={form.fit_factor}
              onChange={e => field('fit_factor', e.target.value)}
              placeholder="e.g. 200"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result <span className="text-red-500">*</span>
            </label>
            <select
              value={form.result}
              onChange={e => field('result', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="exempt_papr">Exempt (PAPR user)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider / Tester</label>
            <input
              type="text"
              value={form.provider}
              onChange={e => field('provider', e.target.value)}
              placeholder="e.g. SafeWork Training"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
          <input
            type="date"
            value={form.next_due_date}
            onChange={e => field('next_due_date', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="text-xs text-gray-400 mt-1">Auto-set to 2 years from test date (AS/NZS 1715 recommendation)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Certificate (optional)
          </label>
          <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-400 transition-colors">
            <Upload className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {certificateFile ? certificateFile.name : 'Click to upload PDF or image'}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => setCertificateFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {uploading ? 'Uploading certificate…' : loading ? 'Saving…' : 'Save Fit-Test Record'}
          </button>
          <Link
            href="/fit-tests"
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
