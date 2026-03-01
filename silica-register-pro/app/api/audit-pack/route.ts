import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { AuditPackPDF as AuditPackDocument } from '@/lib/pdf/audit-pack'
import React from 'react'

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // seconds — PDF generation can take a moment

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo   = searchParams.get('date_to')
    const siteId   = searchParams.get('site_id') ?? null

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: 'date_from and date_to are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // ── Fetch all data ─────────────────────────────────────────────────────
    const { data: org } = await supabase
      .from('organisations')
      .select('*')
      .single()

    const sitesQuery = supabase.from('sites').select('*').eq('is_active', true)
    if (siteId) sitesQuery.eq('id', siteId)
    const { data: sites } = await sitesQuery.order('name')

    const siteIds = sites?.map(s => s.id) ?? []

    const { data: workers } = await supabase
      .from('worker_fit_test_status')
      .select('*')
      .order('full_name')

    let eventsQuery = supabase
      .from('exposure_events')
      .select('*, workers(full_name, role_trade), sites(name)')
      .gte('check_in_at', `${dateFrom}T00:00:00`)
      .lte('check_in_at', `${dateTo}T23:59:59`)
      .order('check_in_at', { ascending: false })

    if (siteId) eventsQuery = eventsQuery.eq('site_id', siteId)
    else if (siteIds.length) eventsQuery = eventsQuery.in('site_id', siteIds)

    const { data: exposureEvents } = await eventsQuery

    const { data: fitTests } = await supabase
      .from('fit_tests')
      .select('*, workers(full_name, role_trade)')
      .order('test_date', { ascending: false })

    let monitoringQuery = supabase
      .from('monitoring_uploads')
      .select('*, sites(name)')
      .gte('created_at', `${dateFrom}T00:00:00`)
      .lte('created_at', `${dateTo}T23:59:59`)
      .order('created_at', { ascending: false })

    if (siteId) monitoringQuery = monitoringQuery.eq('site_id', siteId)

    const { data: monitoringUploads } = await monitoringQuery

    // ── Generate PDF ───────────────────────────────────────────────────────
    const data = {
      organisation: org ?? { name: 'My Organisation', abn: null, address: null },
      dateRange: { from: dateFrom, to: dateTo },
      sites: sites ?? [],
      workers: workers ?? [],
      exposureEvents: exposureEvents ?? [],
      fitTests: fitTests ?? [],
      monitoringUploads: monitoringUploads ?? [],
      generatedAt: new Date().toISOString(),
    }

    const pdfBuffer = await renderToBuffer(
      React.createElement(AuditPackDocument, { data })
    )

    const filename = `SilicaRegisterPro_AuditPack_${dateFrom}_to_${dateTo}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    console.error('[audit-pack] error:', err)
    return NextResponse.json({ error: err.message ?? 'Failed to generate audit pack' }, { status: 500 })
  }
}
