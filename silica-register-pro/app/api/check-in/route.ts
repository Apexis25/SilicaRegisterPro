import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { site_id, organisation_id, worker_id, task_activity, rpe_type, controls_used } = body

    if (!site_id || !organisation_id || !worker_id || !task_activity) {
      return NextResponse.json(
        { error: 'site_id, organisation_id, worker_id and task_activity are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Verify the site belongs to this organisation (basic sanity check)
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, organisation_id, is_active')
      .eq('id', site_id)
      .eq('organisation_id', organisation_id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 })
    }

    if (!site.is_active) {
      return NextResponse.json({ error: 'This site is no longer active' }, { status: 400 })
    }

    // Check if worker already has an open check-in at this site
    const { data: openEvent } = await supabase
      .from('exposure_events')
      .select('id, check_in_at')
      .eq('worker_id', worker_id)
      .eq('site_id', site_id)
      .is('check_out_at', null)
      .order('check_in_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (openEvent) {
      return NextResponse.json(
        { error: 'Worker already has an open check-in at this site', event_id: openEvent.id },
        { status: 409 }
      )
    }

    // Create exposure event
    const { data: event, error: insertError } = await supabase
      .from('exposure_events')
      .insert({
        organisation_id,
        worker_id,
        site_id,
        task_activity,
        rpe_type: rpe_type || null,
        controls_used: controls_used ?? [],
        logged_via: 'qr',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[check-in] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to log check-in' }, { status: 500 })
    }

    return NextResponse.json({ success: true, event_id: event.id }, { status: 201 })
  } catch (err) {
    console.error('[check-in] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
