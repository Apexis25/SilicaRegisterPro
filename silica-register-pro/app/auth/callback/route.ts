import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/database.types'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code    = searchParams.get('code')
  const setup   = searchParams.get('setup') === '1'   // new account setup flag
  const next    = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()    { return cookieStore.getAll() },
          setAll(cs)  {
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      if (setup) {
        // New signup — create organisation from metadata
        const meta = session.user.user_metadata
        const orgName = meta?.org_name ?? 'My Organisation'
        const abn     = meta?.abn ?? null

        // Check if org already exists (idempotency)
        const { data: profile } = await supabase
          .from('profiles')
          .select('organisation_id')
          .eq('id', session.user.id)
          .single()

        if (!profile?.organisation_id) {
          // Create org
          const { data: org } = await supabase
            .from('organisations')
            .insert({ name: orgName, abn })
            .select()
            .single()

          if (org) {
            // Link profile to org as owner
            await supabase
              .from('profiles')
              .update({
                organisation_id: org.id,
                full_name: meta?.full_name ?? null,
                role: 'owner',
              })
              .eq('id', session.user.id)
          }
        }

        return NextResponse.redirect(`${origin}/`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Auth failed — redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
