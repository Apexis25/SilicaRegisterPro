'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, X, ExternalLink, Plus } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function MonitoringPage() {
  const supabase = createClient()
  const [uploads, setUploads] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    site_id: '',
    description: '',
    monitoring_date: '',
    provider: '',
    result_summary: '',
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadData()
    supabase.from('sites').select('id, name').eq('is_active', true).order('name').then(({ data }) => setSites(data ?? []))
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('monitoring_uploads')
      .select('*, sites(name)')
      .order('created_at', { ascending: false })
    setUploads(data ?? [])
    setLoading(false)
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!file || !form.description) {
      setError('A file and description are required.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `monitoring/${Date.now()}.${ext}`
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('monitoring')
      .upload(path, file, { contentType: file.type })

    if (uploadErr) {
      setError(`Upload failed: ${uploadErr.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('monitoring').getPublicUrl(uploadData.path)

    const { error: insertErr } = await supabase.from('monitoring_uploads').insert({
      site_id: form.site_id || null,
      description: form.description,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: ext ?? null,
      file_size_bytes: file.size,
      monitoring_date: form.monitoring_date || null,
      provider: form.provider || null,
      result_summary: form.result_summary || null,
    })

    setUploading(false)

    if (insertErr) {
      setError(insertErr.message)
      return
    }

    setShowForm(false)
    setFile(null)
    setForm({ site_id: '', description: '', monitoring_date: '', provider: '', result_summary: '' })
    loadData()
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Air Monitoring Uploads</h1>
          <p className="text-gray-500 mt-1">Store and manage silica air monitoring reports from hygienists and accredited laboratories</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Upload Report
        </button>
      </div>

      {/* Upload Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upload Monitoring Report</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              {/* File Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report File <span className="text-red-500">*</span>
                </label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-lg p-6 cursor-pointer hover:border-green-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-300" />
                  <span className="text-sm text-gray-500 text-center">
                    {file ? (
                      <span className="font-medium text-gray-700">{file.name} ({formatBytes(file.size)})</span>
                    ) : (
                      <>Click to upload PDF, Excel or Word report<br /><span className="text-xs text-gray-400">PDF, XLSX, DOCX accepted</span></>
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.docx,.doc,.csv"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Baseline air monitoring — Site A Q1 2026"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                  <select
                    value={form.site_id}
                    onChange={e => setForm(f => ({ ...f, site_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All / Not site-specific</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monitoring Date</label>
                  <input
                    type="date"
                    value={form.monitoring_date}
                    onChange={e => setForm(f => ({ ...f, monitoring_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider / Hygienist / Lab</label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                  placeholder="e.g. Air Quality Specialists Pty Ltd"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Result Summary</label>
                <textarea
                  value={form.result_summary}
                  onChange={e => setForm(f => ({ ...f, result_summary: e.target.value }))}
                  rows={2}
                  placeholder="e.g. All samples below 0.05 mg/m³ TWA. Compliant."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {uploading ? 'Uploading…' : 'Upload Report'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Uploads Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Description</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Site</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Monitoring Date</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Provider</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Result Summary</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">File</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">Loading…</td>
                </tr>
              )}
              {!loading && uploads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No monitoring reports yet. Click <strong>Upload Report</strong> to add the first one.
                  </td>
                </tr>
              )}
              {uploads.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{u.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{(u.sites as any)?.name ?? 'All sites'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {u.monitoring_date ? format(parseISO(u.monitoring_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.provider ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{u.result_summary ?? '—'}</td>
                  <td className="px-6 py-4">
                    <a
                      href={u.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium"
                    >
                      {u.file_name.length > 20 ? u.file_name.slice(0, 18) + '…' : u.file_name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-xs text-gray-400">{formatBytes(u.file_size_bytes)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {format(parseISO(u.created_at), 'dd MMM yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  function formatBytes(bytes: number | null) {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
}
