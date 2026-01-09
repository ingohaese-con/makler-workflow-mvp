'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setLoading(true)

      // User prüfen
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (cancelled) return

      if (userError) {
        // Optional: Auth-Fehler sichtbar machen
        setError(userError)
      }

      const u = userData?.user ?? null
      setUser(u)

      // Wenn nicht eingeloggt, Countdown vorbereiten und nicht weiter laden
      if (!u) {
        setCountdown(3)
        setLoading(false)
        return
      }

      // Nur wenn eingeloggt: Daten laden
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (cancelled) return

      if (error) setError(error)
      else setData(data)

      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Countdown-Timer für Weiterleitung
  useEffect(() => {
    if (loading || user) return

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, user])

  // Redirect wenn Countdown abgelaufen
  useEffect(() => {
    if (!loading && !user && countdown <= 0) {
      router.replace('/login')
    }
  }, [countdown, loading, user, router])

  // Während Auth-Prüfung
  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui' }}>
        <p>Lade…</p>
      </main>
    )
  }

  // Wenn nicht eingeloggt: Meldung + Countdown wirklich zentriert
  if (!user) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          fontFamily: 'system-ui',
          textAlign: 'center',
        }}
      >
        <h1>Nicht eingeloggt</h1>
        <p style={{ fontSize: 18, marginTop: 20 }}>
          Weiterleitung zum Login in{' '}
          <strong style={{ fontSize: 24, color: '#0066cc' }}>
            {Math.max(countdown, 0)}
          </strong>{' '}
          Sekunden…
        </p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>Supabase Connection Test</h1>

      {!data && !error && <p>Lade…</p>}

      {error && (
        <pre style={{ padding: 12, background: '#fee' }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {data && (
        <pre style={{ padding: 12, background: '#f5f5f5' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  )
}
