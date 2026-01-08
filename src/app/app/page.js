'use client'
// ↑ Client Component:
// - läuft im Browser
// - benötigt Zugriff auf Cookies / Session
// - nutzt fetch + Supabase Auth

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
// ↑ normaler Supabase Client (anon/publishable key)
//   → liest Session, ruft unsere API auf
import WorkflowsList from '@/components/WorkflowsList'
// ↑ unsere eigene Component welche die Workflows listet

export default function AppPage() {
  // ======================================================
  // State: eingeloggter User
  // ======================================================
  const [user, setUser] = useState(null)
  // enthält Supabase Auth User
  // null = nicht eingeloggt

  const [loading, setLoading] = useState(true)
  // verhindert Flackern, solange wir prüfen

  // ======================================================
  // State: Tenant-Information (aus ensure-tenant API)
  // ======================================================
  const [tenantInfo, setTenantInfo] = useState(null)
  // erwartet z. B.: { tenant_id: "...", created: false }

  const [tenantError, setTenantError] = useState(null)
  // falls API-Fehler auftreten

  // ======================================================
  // Beim Laden der Seite:
  // 1) eingeloggten User ermitteln
  // 2) ensure-tenant API aufrufen
  // ======================================================
  useEffect(() => {
    ;(async () => {
      // ----------------------------------
      // 1) Aktuellen User holen
      // ----------------------------------
      const { data } = await supabase.auth.getUser()
      const u = data?.user ?? null
      setUser(u)

      // ----------------------------------
      // 2) Nur wenn eingeloggt:
      //    Tenant sicherstellen
      // ----------------------------------
      if (u) {
        // Session holen, um an das JWT zu kommen
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token

        // API-Route aufrufen
        const res = await fetch('/api/ensure-tenant', {
          method: 'POST',
          headers: {
            // JWT wird im Authorization Header übergeben
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const json = await res.json()

        if (!res.ok) {
          // z. B. 401 oder 500
          setTenantError(json)
        } else {
          // Erfolgsfall:
          // json = { tenant_id, created }
          setTenantInfo(json)
        }
      }

      setLoading(false)
    })()
  }, [])
  // [] = nur einmal beim ersten Render

  // ======================================================
  // Logout
  // ======================================================
  async function logout() {
    await supabase.auth.signOut()
    // Session löschen
    window.location.href = '/login'
    // zurück zur Login-Seite
  }

  // ======================================================
  // UI-Logik
  // ======================================================

  // Während wir prüfen
  if (loading) {
    return <main style={{ padding: 24 }}>Lade…</main>
  }

  // Nicht eingeloggt
  if (!user) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui' }}>
        <h1>Nicht eingeloggt</h1>
        <p>
          Bitte <a href="/login">einloggen</a>.
        </p>
      </main>
    )
  }

  // ======================================================
  // Erfolgsfall: User + Tenant vorhanden
  // ======================================================
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>App</h1>

      <p>
        Eingeloggt als: <b>{user.email}</b>
      </p>

      {/* -------------------------------
           Tenant-Info sichtbar machen
         ------------------------------- */}
      <h2 style={{ marginTop: 16 }}>Tenant</h2>

      {tenantError && (
        <pre style={{ padding: 12, background: '#fee' }}>
          {JSON.stringify(tenantError, null, 2)}
        </pre>
      )}

      {tenantInfo && (
        <pre style={{ padding: 12, background: '#f5f5f5' }}>
          {JSON.stringify(tenantInfo, null, 2)}
        </pre>
      )}
      
      <WorkflowsList tenantId={tenantInfo?.tenant_id} />


      {/* -------------------------------
           Logout
         ------------------------------- */}
      <button onClick={logout} style={{ padding: 10, marginTop: 16 }}>
        Logout
      </button>
    </main>
  )
}
