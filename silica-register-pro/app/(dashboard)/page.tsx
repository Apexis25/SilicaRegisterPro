import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, MapPin, ShieldCheck, AlertTriangle, FileText, Wind } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Dashboard' }

async function getDashboardStats(orgId: string) {
  const supabase = await createClient()

  const [workers, sites, fitTests, events, monitoring] = await Promise.all([
    supabase.from('workers').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('is_active', true),
    supabase.from('sites').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).eq('is_active', true),
    supabase.from('worker_fit_test_status').select('*').eq('organisation_id', orgId),
    supabase.from('exposure_events').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId).gte('check_in_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase.from('monitoring_uploads').select('id', { count: 'exact', head: true }).eq('organisation_id', orgId),
  ])

  const ft = fitTests.data ?? []
  const overdue    = ft.filter(f => f.status === 'overdue').length
  const expiring   = ft.filter(f => f.status === 'expiring_soon').length
  const noRecord   = ft.filter(f => f.status === 'no_record').length

  return {
    workers:    workers.count ?? 0,
    sites:      sites.count ?? 0,
    events30:   events.count ?? 0,
    monitoring: monitoring.count ?? 0,
    overdue, expiring, noRecord,
    fitTests: ft,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organisations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.organisation_id) redirect('/onboarding')

  const stats = await getDashboardStats(profile.organisation_id)
  const org   = profile.organisations as any

  const alertCount = stats.overdue + stats.noRecord

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org?.name ?? 'Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'EEEE d MMMM yyyy')}</p>
        </div>
        <Link
          href="/reports"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          Generate Audit Pack
        </Link>
      </div>

      {/* Alert Banner */}
      {alertCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Compliance action required
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              {stats.overdue > 0 && `${stats.overdue} worker${stats.overdue > 1 ? 's' : ''} with overdue fit-tests. `}
              {stats.noRecord > 0 && `${stats.noRecord} worker${stats.noRecord > 1 ? 's' : ''} with no fit-test on record.`}
            </p>
            <Link href="/fit-tests" className="text-sm font-medium text-red-700 underline mt-1 inline-block">
              View fit-test register →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard href="/workers"   icon={Users}       label="Active Workers"     value={stats.workers}    color="blue" />
        <StatCard href="/sites"     icon={MapPin}      label="Active Sites"       value={stats.sites}      color="green" />
        <StatCard href="/reports"   icon={FileText}    label="Exposure Events (30d)" value={stats.events30} color="purple" />
        <StatCard href="/monitoring" icon={Wind}       label="Monitoring Uploads" value={stats.monitoring} color="orange" />
      </div>

      {/* Fit-Test Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Fit-Test Status Overview</h2>
          <div className="space-y-3">
            <FitTestRow label="Current"       count={stats.fitTests.filter(f => f.status === 'current').length}      className="badge-current" />
            <FitTestRow label="Expiring Soon" count={stats.expiring}  className="badge-expiring" />
            <FitTestRow label="Overdue"       count={stats.overdue}   className="badge-overdue" />
            <FitTestRow label="No Record"     count={stats.noRecord}  className="badge-no-record" />
          </div>
          <Link href="/fit-tests" className="mt-4 block text-sm text-green-600 hover:text-green-700 font-medium">
            Manage fit-test register →
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction href="/workers/new"   label="Add a Worker" desc="Register a new silica worker" />
            <QuickAction href="/sites/new"     label="Add a Site"   desc="Create a site and generate QR code" />
            <QuickAction href="/fit-tests/new" label="Record Fit-Test" desc="Log a fit-test result" />
            <QuickAction href="/monitoring"    label="Upload Monitoring" desc="Store an air monitoring result" />
            <QuickAction href="/reports"       label="Export Audit Pack" desc="Generate your 1-click PDF" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ href, icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </Link>
  )
}

function FitTestRow({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={className}>{count}</span>
    </div>
  )
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <span className="text-gray-300 group-hover:text-green-500 transition-colors">→</span>
    </Link>
  )
}
