import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, worker_id } = body

    if (!event_id || !worker_id) {
      return NextResponse.json({ error: 'event_id and worker_id are required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify the event belongs to this worker and is still open
    const { data: event, error: fetchError } = await supabase
      .from('exposure_events')
      .select('id, worker_id, check_in_at, check_out_at')
      .eq('id', event_id)
      .eq('worker_id', worker_id)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.check_out_at) {
      return NextResponse.json({ error: 'Worker has already checked out' }, { status: 409 })
    }

    const checkOutAt = new Date().toISOString()

    // Update — the database trigger compute_exposure_duration will auto-calculate duration_hours
    const { data: updated, error: updateError } = await supabase
      .from('exposure_events')
      .update({ check_out_at: checkOutAt })
      .eq('id', event_id)
      .select()
      .single()

    if (updateError) {
      console.error('[check-out] update error:', updateError)
      return NextResponse.json({ error: 'Failed to record check-out' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      event_id: updated.id,
      check_in_at: updated.check_in_at,
      check_out_at: updated.check_out_at,
      duration_hours: updated.duration_hours,
    })
  } catch (err) {
    console.error('[check-out] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
