'use client'
// ↑ Wichtig:
// Diese Datei läuft im Browser (Client Component).
// Supabase Auth (signUp / signIn) braucht Zugriff auf window, Cookies etc.
// Deshalb MUSS das eine Client-Komponente sein.

import { useState } from 'react'
// ↑ React Hook, um Formularzustand (Email, Passwort, Meldungen) zu speichern

import { supabase } from '@/lib/supabaseClient'
// ↑ Unser zentraler Supabase-Client
// nutzt Project URL + anon/publishable Key aus .env.local

export default function LoginPage() {
  // --- State für Formularfelder ---
  const [email, setEmail] = useState('')
  // speichert die aktuell eingegebene Email-Adresse

  const [password, setPassword] = useState('')
  // speichert das Passwort

  const [msg, setMsg] = useState('')
  // Status-/Fehlermeldung für den Nutzer (z. B. Login ok / Fehler)

  // ==============================
  // SIGNUP: neuen Benutzer anlegen
  // ==============================
  async function signUp() {
    setMsg('Signup läuft …')
    // UI-Feedback, damit der Nutzer weiß, dass etwas passiert

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    // Supabase:
    // - legt einen neuen User in auth.users an
    // - erzeugt eine User-ID (UUID)
    // - speichert Email + Passwort (gehasht!)

    if (error) {
      // z. B.:
      // - Email schon vergeben
      // - Passwort zu kurz
      setMsg(`Fehler: ${error.message}`)
    } else {
      // Bei dir: Email-Bestätigung ist AUS
      // → User kann sich sofort einloggen
      setMsg('Signup OK. Du kannst dich jetzt einloggen.')
    }
  }

  // ==============================
  // LOGIN: bestehenden User anmelden
  // ==============================
  async function signIn() {
    setMsg('Login läuft …')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Supabase:
    // - prüft Email + Passwort
    // - setzt Session-Cookie im Browser
    // - User ist ab jetzt "eingeloggt"

    if (error) {
      // z. B. falsches Passwort
      return setMsg(`Fehler: ${error.message}`)
    }

    // Login erfolgreich:
    // Weiterleitung in den geschützten App-Bereich
    window.location.href = '/app'
  }

  // ==============================
  // UI (JSX)
  // ==============================
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 420 }}>
      <h1>Makler Login</h1>

      {/* Einfaches Formular ohne <form>-Submit,
          damit wir volle Kontrolle über die Logik haben */}
      <div style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            // bindet Eingabe an den State
            onChange={(e) => setEmail(e.target.value)}
            placeholder="makler@beispiel.de"
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Passwort
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            // Browser maskiert Eingabe
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={signUp} style={{ padding: 10 }}>
            Signup
          </button>

          <button onClick={signIn} style={{ padding: 10 }}>
            Login
          </button>
        </div>

        {/* Status-/Fehlermeldung */}
        {msg && <p>{msg}</p>}
      </div>
    </main>
  )
}
