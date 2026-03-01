import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckInForm } from '@/components/check-in/check-in-form'

export const metadata = { title: 'Site Check-In | SilicaRegister Pro' }

export default async function CheckInPage({ params }: { params: { siteId: string } }) {
  const supabase = createServiceClient()

  // Look up site by QR token (public — no auth)
  const { data: site } = await supabase
    .from('sites')
    .select('id, name, address, organisation_id, is_active')
    .eq('qr_token', params.siteId)
    .single()

  if (!site || !site.is_active) notFound()

  // Get workers assigned to this site
  const { data: workers } = await supabase
    .from('worker_sites')
    .select('workers(id, full_name, role_trade, employer)')
    .eq('site_id', site.id)
    .order('workers(full_name)')

  const workerList = (workers ?? []).map((ws: any) => ws.workers).filter(Boolean)

  // Get any open (checked-in but not checked out) events for this site
  const { data: openEvents } = await supabase
    .from('exposure_events')
    .select('id, worker_id, task_activity, check_in_at, workers(full_name)')
    .eq('site_id', site.id)
    .is('check_out_at', null)
    .gte('check_in_at', new Date(Date.now() - 24 * 3600000).toISOString())

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-xs font-bold">S</div>
            <span className="text-xs text-gray-400">SilicaRegister Pro</span>
          </div>
          <h1 className="text-lg font-bold">{site.name}</h1>
          {site.address && <p className="text-sm text-gray-400">{site.address}</p>}
        </div>
      </div>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {/* Open check-ins */}
        {(openEvents ?? []).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Currently Checked In</h2>
            <div className="space-y-2">
              {(openEvents ?? []).map((e: any) => (
                <div key={e.id} className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.workers?.full_name}</p>
                    <p className="text-xs text-gray-400">{e.task_activity}</p>
                  </div>
                  <CheckOutButton eventId={e.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Check-in form */}
        <CheckInForm siteId={site.id} orgId={site.organisation_id} workers={workerList} />
      </div>
    </div>
  )
}

// Simple server-rendered check-out button
function CheckOutButton({ eventId }: { eventId: string }) {
  return (
    <form action={`/api/check-out`} method="POST">
      <input type="hidden" name="event_id" value={eventId} />
      <button
        type="submit"
        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
      >
        Check Out
      </button>
    </form>
  )
}
