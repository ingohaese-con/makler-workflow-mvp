'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function WorkflowsList({ tenantId }) {
  const [loading, setLoading] = useState(true)
  const [workflows, setWorkflows] = useState([])
  const [error, setError] = useState(null)

  const [busyId, setBusyId] = useState(null) // Sperre pro Workflow (Statuswechsel)
  const [creating, setCreating] = useState(false) // Sperre beim Anlegen

  // Eingabe für neuen Workflow
  const [newTitle, setNewTitle] = useState('')

  // UI-Schalter: erledigte Workflows anzeigen?
  const [showDone, setShowDone] = useState(true)

  // ------------------------------------------------
  // Helper: Workflows laden
  // ------------------------------------------------
  async function loadWorkflows(currentTenantId) {
    if (!currentTenantId) return

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('workflows')
      .select('id, tenant_id, title, status, created_at, updated_at')
      .eq('tenant_id', currentTenantId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error)
      setWorkflows([])
    } else {
      setWorkflows(data || [])
    }

    setLoading(false)
  }

  // ------------------------------------------------
  // Beim Setzen/Wechseln von tenantId: laden
  // ------------------------------------------------
  useEffect(() => {
    loadWorkflows(tenantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  // ------------------------------------------------
  // Status toggeln (in_arbeit <-> erledigt)
  // ------------------------------------------------
  async function toggleStatus(workflow) {
    try {
      setBusyId(workflow.id)
      setError(null)

      const nextStatus = workflow.status === 'erledigt' ? 'in_arbeit' : 'erledigt'

      const { data, error } = await supabase
        .from('workflows')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflow.id)
        .select('id, tenant_id, title, status, created_at, updated_at')
        .single()

      if (error) throw error

      // UI lokal updaten
      setWorkflows((prev) => prev.map((w) => (w.id === workflow.id ? data : w)))
    } catch (e) {
      setError(e)
    } finally {
      setBusyId(null)
    }
  }

  // ------------------------------------------------
  // Neuen Workflow anlegen
  // ------------------------------------------------
  async function createWorkflow() {
    if (!tenantId) return
    const title = newTitle.trim()

    if (!title) {
      setError({ message: 'Bitte einen Titel eingeben.' })
      return
    }

    try {
      setCreating(true)
      setError(null)

      const { data, error } = await supabase
        .from('workflows')
        .insert({
          tenant_id: tenantId,
          title,
          status: 'in_arbeit',
        })
        .select('id, tenant_id, title, status, created_at, updated_at')
        .single()

      if (error) throw error

      // Neuen Eintrag vorne in die Liste
      setWorkflows((prev) => [data, ...prev])
      setNewTitle('')
    } catch (e) {
      setError(e)
    } finally {
      setCreating(false)
    }
  }

  function onNewTitleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      createWorkflow()
    }
  }

  // ------------------------------------------------
  // Ableitungen: in Arbeit vs erledigt
  // useMemo: nur neu berechnen, wenn workflows sich ändern
  // ------------------------------------------------
  const inWork = useMemo(
    () => workflows.filter((w) => w.status !== 'erledigt'),
    [workflows]
  )

  const done = useMemo(
    () => workflows.filter((w) => w.status === 'erledigt'),
    [workflows]
  )

  // ------------------------------------------------
  // UI: Workflow Card (kleiner Helper)
  // ------------------------------------------------
  function WorkflowItem({ w }) {
    return (
      <li
        key={w.id}
        style={{
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{w.title}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              Status: <b>{w.status}</b>
            </div>
          </div>

          <button
            onClick={() => toggleStatus(w)}
            disabled={busyId === w.id}
            style={{ padding: 10, minWidth: 140 }}
          >
            {busyId === w.id ? '…' : 'Status wechseln'}
          </button>
        </div>
      </li>
    )
  }

  // ------------------------------------------------
  // Render
  // ------------------------------------------------
  return (
    <section style={{ marginTop: 16 }}>
      <h2>Workflows</h2>

      {!tenantId && <p>Kein Tenant gesetzt.</p>}

      {/* Neuer Workflow: Eingabe + Button */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 10,
          marginBottom: 12,
          alignItems: 'center',
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={onNewTitleKeyDown}
          placeholder="Neuer Workflow Titel (z. B. Unterlagen prüfen)"
          style={{ flex: 1, padding: 10 }}
          disabled={!tenantId || creating}
        />

        <button
          onClick={createWorkflow}
          disabled={!tenantId || creating}
          style={{ padding: 10, minWidth: 180 }}
        >
          {creating ? 'Lege an…' : 'Neuen Workflow anlegen'}
        </button>
      </div>

      {/* Fehlerausgabe */}
      {error && (
        <pre style={{ padding: 12, background: '#fee' }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      {loading && <p>Lade Workflows…</p>}

      {/* ===== Bereich 1: In Arbeit ===== */}
      {!loading && (
        <>
          <h3 style={{ marginTop: 10 }}>In Arbeit</h3>

          {inWork.length === 0 ? (
            <p>Keine Workflows in Arbeit.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
              {inWork.map((w) => (
                <WorkflowItem key={w.id} w={w} />
              ))}
            </ul>
          )}

          {/* ===== Bereich 2: Erledigt (mit Toggle) ===== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <h3 style={{ margin: 0 }}>Erledigt</h3>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
              />
              anzeigen ({done.length})
            </label>
          </div>

          {showDone ? (
            done.length === 0 ? (
              <p>Keine erledigten Workflows.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 10 }}>
                {done.map((w) => (
                  <WorkflowItem key={w.id} w={w} />
                ))}
              </ul>
            )
          ) : (
            <p style={{ opacity: 0.7 }}>Erledigte Workflows sind ausgeblendet.</p>
          )}
        </>
      )}

      {/* Optional: Reload */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => loadWorkflows(tenantId)}
          disabled={!tenantId || loading}
          style={{ padding: 10 }}
        >
          Aktualisieren
        </button>
      </div>
    </section>
  )
}

