'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) setError(error)
      else setData(data)
    })()
  }, [])

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

