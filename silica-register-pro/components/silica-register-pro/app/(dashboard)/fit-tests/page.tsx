import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    current:       { label: 'Current',       cls: 'badge-current',   Icon: CheckCircle },
    expiring_soon: { label: 'Expiring Soon', cls: 'badge-expiring',  Icon: Clock },
    overdue:       { label: 'Overdue',        cls: 'badge-overdue',   Icon: AlertTriangle },
    no_record:     { label: 'No Record',      cls: 'badge-no-record', Icon: XCircle },
    exempt:        { label: 'Exempt (PAPR)',  cls: 'badge-current',   Icon: CheckCircle },
  }
  const { label, cls, Icon } = map[status] ?? map['no_record']
  return (
    <span className={`${cls} inline-flex items-center gap-1`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  )
}

export default async function FitTestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fit-test status per worker (uses the view)
  const { data: workers } = await supabase
    .from('worker_fit_test_status')
    .select('*')
    .order('full_name')

  // All individual fit test records
  const { data: fitTests } = await supabase
    .from('fit_tests')
    .select('*, workers(full_name, role_trade)')
    .order('test_date', { ascending: false })

  const counts = {
    current:   workers?.filter(w => w.status === 'current').length ?? 0,
    expiring:  workers?.filter(w => w.status === 'expiring_soon').length ?? 0,
    overdue:   workers?.filter(w => w.status === 'overdue').length ?? 0,
    no_record: workers?.filter(w => w.status === 'no_record').length ?? 0,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fit-Test Register</h1>
          <p className="text-gray-500 mt-1">Track RPE fit-test certificates and compliance status for all workers</p>
        </div>
        <Link
          href="/fit-tests/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Fit Test
        </Link>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Current</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{counts.current}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-500">Expiring Soon</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{counts.expiring}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-amber-100 shadow-sm bg-amber-50">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-500">Overdue</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{counts.overdue}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">No Record</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{counts.no_record}</p>
        </div>
      </div>

      {/* Compliance Alert */}
      {(counts.overdue > 0 || counts.expiring > 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Compliance Action Required</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {counts.overdue > 0 && `${counts.overdue} worker${counts.overdue > 1 ? 's have' : ' has'} an overdue fit test. `}
              {counts.expiring > 0 && `${counts.expiring} fit test${counts.expiring > 1 ? 's are' : ' is'} expiring within 30 days.`}
            </p>
          </div>
        </div>
      )}

      {/* Worker Compliance Overview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Worker Compliance Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Worker</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">RPE Type</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Last Test</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Next Due</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workers?.map(w => (
                <tr key={w.worker_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{w.full_name}</td>
                  <td className="px-6 py-4 text-gray-600">{w.rpe_type ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {w.test_date ? format(parseISO(w.test_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {w.next_due_date ? format(parseISO(w.next_due_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={w.status ?? 'no_record'} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/fit-tests/new?worker=${w.worker_id}`}
                      className="text-green-600 hover:text-green-700 text-xs font-medium"
                    >
                      Add Test →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Fit Test History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Full Fit-Test History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Worker</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">RPE Type / Model</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Test Date</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Fit Factor</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Result</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Provider</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Next Due</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fitTests?.map(ft => (
                <tr key={ft.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {(ft.workers as any)?.full_name ?? '—'}
                    <div className="text-xs text-gray-400">{(ft.workers as any)?.role_trade}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ft.rpe_type}
                    {ft.rpe_model && <div className="text-xs text-gray-400">{ft.rpe_model}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {format(parseISO(ft.test_date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {ft.fit_factor ? ft.fit_factor.toString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ft.result === 'pass' ? 'bg-green-100 text-green-700' :
                      ft.result === 'exempt_papr' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {ft.result === 'exempt_papr' ? 'Exempt (PAPR)' : ft.result.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{ft.provider ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {ft.next_due_date ? format(parseISO(ft.next_due_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {ft.certificate_url ? (
                      <a
                        href={ft.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 text-xs font-medium"
                      >
                        View PDF →
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!fitTests || fitTests.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No fit-test records yet. Click <strong>Add Fit Test</strong> to add the first record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
