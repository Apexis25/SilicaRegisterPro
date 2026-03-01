import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, QrCode, Users, Clock, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import QRDisplay from '@/components/sites/qr-display'

export default async function SiteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!site) notFound()

  // Recent exposure events for this site
  const { data: events } = await supabase
    .from('exposure_events')
    .select('*, workers(full_name, role_trade)')
    .eq('site_id', site.id)
    .order('check_in_at', { ascending: false })
    .limit(50)

  // Assigned workers
  const { data: assignments } = await supabase
    .from('worker_sites')
    .select('workers(id, full_name, role_trade, employer)')
    .eq('site_id', site.id)

  const workers = assignments?.map((a: any) => a.workers).filter(Boolean) ?? []
  const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourapp.com'}/check-in/${site.qr_token}`

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/sites" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Sites
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                site.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {site.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {site.address && <p className="text-gray-500">{site.address}</p>}
            {site.principal_contractor && (
              <p className="text-sm text-gray-400 mt-0.5">PC: {site.principal_contractor}</p>
            )}
            {site.project_number && (
              <p className="text-sm text-gray-400">Project: {site.project_number}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* QR Code */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 w-full">
            <QrCode className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Site QR Code</h2>
          </div>
          <QRDisplay url={checkInUrl} siteName={site.name} />
          <p className="text-xs text-gray-400 text-center mt-3">
            Workers scan this code to log silica exposure
          </p>
          <p className="text-xs text-green-600 font-mono mt-2 break-all text-center">{checkInUrl}</p>
        </div>

        {/* Assigned Workers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Assigned Workers</h2>
            <span className="ml-auto text-sm text-gray-400">{workers.length}</span>
          </div>
          {workers.length === 0 ? (
            <p className="text-sm text-gray-400">No workers assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {workers.map((w: any) => (
                <div key={w.id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {w.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{w.full_name}</p>
                    <p className="text-gray-400 text-xs">{w.role_trade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Activity</h2>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-gray-900">{events?.length ?? 0}</p>
              <p className="text-sm text-gray-500">Total exposure events</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {events?.filter(e => !e.check_out_at).length ?? 0}
              </p>
              <p className="text-sm text-gray-500">Currently checked in</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {events?.reduce((sum, e) => sum + (parseFloat(e.duration_hours) || 0), 0).toFixed(1) ?? '0.0'}
              </p>
              <p className="text-sm text-gray-500">Total logged hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Exposure Events</h2>
          <Link
            href={`/reports?site_id=${site.id}`}
            className="text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> Audit Pack
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Worker</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Task</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">RPE</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Check In</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Check Out</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Duration</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium">Via</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {events?.map(ev => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">
                    {(ev.workers as any)?.full_name}
                    <div className="text-xs text-gray-400">{(ev.workers as any)?.role_trade}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{ev.task_activity}</td>
                  <td className="px-6 py-3 text-gray-600 text-xs">{ev.rpe_type ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-600">
                    {format(parseISO(ev.check_in_at), 'dd MMM HH:mm')}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {ev.check_out_at ? format(parseISO(ev.check_out_at), 'dd MMM HH:mm') : (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {ev.duration_hours ? `${ev.duration_hours}h` : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">
                      {ev.logged_via}
                    </span>
                  </td>
                </tr>
              ))}
              {(!events || events.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400 text-sm">
                    No exposure events recorded yet for this site.
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
