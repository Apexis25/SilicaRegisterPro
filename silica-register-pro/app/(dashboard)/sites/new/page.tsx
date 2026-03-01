'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function NewSitePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    address: '',
    principal_contractor: '',
    project_number: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name) { setError('Site name is required.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: insertError } = await supabase.from('sites').insert({
      name: form.name,
      address: form.address || null,
      principal_contractor: form.principal_contractor || null,
      project_number: form.project_number || null,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/sites')
    router.refresh()
  }

  const field = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/sites" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sites
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Site</h1>
        <p className="text-gray-500 mt-1">Create a new construction site. A unique QR code will be generated automatically.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => field('name', e.target.value)}
            placeholder="e.g. 42 King St Renovation"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site Address</label>
          <input
            type="text"
            value={form.address}
            onChange={e => field('address', e.target.value)}
            placeholder="e.g. 42 King Street, Sydney NSW 2000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Contractor</label>
            <input
              type="text"
              value={form.principal_contractor}
              onChange={e => field('principal_contractor', e.target.value)}
              placeholder="e.g. BuildCo Pty Ltd"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Number</label>
            <input
              type="text"
              value={form.project_number}
              onChange={e => field('project_number', e.target.value)}
              placeholder="e.g. PRJ-2026-001"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
          A unique QR code will be generated for this site. Workers scan it to log silica exposure events.
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Creating…' : 'Create Site'}
          </button>
          <Link
            href="/sites"
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
