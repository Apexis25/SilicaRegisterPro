import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, QrCode, MapPin } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Sites & QR Codes' }

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organisation_id').eq('id', user!.id).single()

  const { data: sites } = await supabase
    .from('sites')
    .select('*, worker_sites(count), exposure_events(count)')
    .eq('organisation_id', profile!.organisation_id!)
    .order('created_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.silicaregisterpro.com.au'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sites & QR Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{sites?.length ?? 0} active sites</p>
        </div>
        <Link href="/sites/new" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Site
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(sites ?? []).map(site => (
          <div key={site.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{site.name}</h3>
                {site.address && <p className="text-xs text-gray-500 mt-0.5">{site.address}</p>}
                {site.principal_contractor && <p className="text-xs text-gray-400 mt-0.5">PC: {site.principal_contractor}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${site.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {site.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">Created {format(new Date(site.created_at), 'dd MMM yyyy')}</p>
            <div className="flex gap-2">
              <Link
                href={`/sites/${site.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 border border-green-600 text-green-600 hover:bg-green-50 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" /> View QR Code
              </Link>
              <Link
                href={`/sites/${site.id}?tab=edit`}
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit Site
              </Link>
            </div>
          </div>
        ))}
        {!sites?.length && (
          <div className="col-span-3 text-center py-16 text-gray-400">
            <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No sites yet. <Link href="/sites/new" className="text-green-600 underline">Add your first site</Link>.
          </div>
        )}
      </div>
    </div>
  )
}
