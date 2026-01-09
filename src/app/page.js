'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    ;(async () => {
      // Prüfe zuerst, ob User eingeloggt ist
      const { data: userData } = await supabase.auth.getUser()
      const u = userData?.user ?? null
      setUser(u)

      // Wenn nicht eingeloggt, starte Countdown
      if (!u) {
        setLoading(false)
        return
      }

      // Nur wenn eingeloggt: Daten laden
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) setError(error)
      else setData(data)

      setLoading(false)
    })()
  }, [])

  // Countdown-Timer für Weiterleitung
  useEffect(() => {
    if (!loading && !user) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            window.location.href = '/login'
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, user])

  // Während Auth-Prüfung
  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui' }}>
        <p>Lade…</p>
      </main>
    )
  }

  // Wenn nicht eingeloggt: Zeige Meldung mit Countdown
  if (!user) {
    return (
      <main style={{ padding: 24, fontFamily: 'system-ui', textAlign: 'center' }}>
        <h1>Nicht eingeloggt</h1>
        <p style={{ fontSize: '18px', marginTop: '20px' }}>
          Weiterleitung zum Login in <strong style={{ fontSize: '24px', color: '#0066cc' }}>{countdown}</strong> Sekunden...
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

