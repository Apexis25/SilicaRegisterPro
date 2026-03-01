import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Workers' }

export default async function WorkersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organisation_id').eq('id', user!.id).single()

  const { data: workers } = await supabase
    .from('workers')
    .select('*, worker_sites(site_id, sites(name))')
    .eq('organisation_id', profile!.organisation_id!)
    .order('full_name')

  const { data: fitStatus } = await supabase
    .from('worker_fit_test_status')
    .select('*')
    .eq('organisation_id', profile!.organisation_id!)

  const statusMap = Object.fromEntries((fitStatus ?? []).map(f => [f.worker_id, f]))

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      current:       'badge-current',
      expiring_soon: 'badge-expiring',
      overdue:       'badge-overdue',
      no_record:     'badge-no-record',
      exempt:        'badge-current',
    }
    const labels: Record<string, string> = {
      current: 'Current', expiring_soon: 'Expiring Soon', overdue: 'Overdue',
      no_record: 'No Record', exempt: 'Exempt (PAPR)',
    }
    return <span className={map[status] ?? 'badge-no-record'}>{labels[status] ?? status}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Silica Worker Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">{workers?.length ?? 0} registered workers</p>
        </div>
        <Link href="/workers/new" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Worker
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Worker', 'Role / Trade', 'Employer', 'Sites', 'Fit-Test Status', 'Added', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(workers ?? []).map(w => {
              const ft = statusMap[w.id]
              return (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${w.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium text-gray-900">{w.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{w.role_trade}</td>
                  <td className="px-4 py-3 text-gray-600">{w.employer ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {(w.worker_sites as any[])?.map((ws: any) => ws.sites?.name).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(ft?.status ?? 'no_record')}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(w.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3">
                    <Link href={`/workers/${w.id}`} className="text-green-600 hover:text-green-700 text-xs font-medium">Edit →</Link>
                  </td>
                </tr>
              )
            })}
            {!workers?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No workers yet. <Link href="/workers/new" className="text-green-600 underline">Add your first worker</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
