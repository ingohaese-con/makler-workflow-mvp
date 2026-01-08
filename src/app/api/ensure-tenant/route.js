import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Supabase-Client, der das JWT aus dem Request benutzt,
// um den aktuell eingeloggten User zu ermitteln.
function supabaseFromRequest(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: request.headers.get('authorization') || '',
      },
    },
  })
}

export async function POST(request) {
  try {
    // 1) User aus dem JWT ermitteln
    const supabase = supabaseFromRequest(request)
    const { data: userData, error: userErr } = await supabase.auth.getUser()

    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = userData.user

    // 2) Prüfen, ob bereits Membership existiert
    const { data: membership, error: mErr } = await supabaseAdmin
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (mErr) {
      return NextResponse.json({ error: mErr.message }, { status: 500 })
    }

    // 3) Falls vorhanden: fertig
    if (membership?.tenant_id) {
      return NextResponse.json({ tenant_id: membership.tenant_id, created: false })
    }

    // 4) Sonst: Tenant anlegen
    const tenantName = `Maklerbüro (${user.email})`

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from('tenants')
      .insert({ name: tenantName })
      .select('id')
      .single()

    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 500 })
    }

    // 5) Membership anlegen
    const { error: tmErr } = await supabaseAdmin
      .from('tenant_members')
      .insert({ tenant_id: tenant.id, user_id: user.id, role: 'owner' })

    if (tmErr) {
      return NextResponse.json({ error: tmErr.message }, { status: 500 })
    }

    return NextResponse.json({ tenant_id: tenant.id, created: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
