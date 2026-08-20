/* ============================================================================
   LEADS
   ----------------------------------------------------------------------------
   Every commission enquiry and mailing-list signup now goes into the database,
   where you can actually read it. Before this they were saved in the visitor's
   own browser, which meant you never saw them — the only thing that reached you
   was the WhatsApp message, and only if they completed the send.

   A copy is still written locally as well. If the network drops between the
   visitor pressing submit and the row landing, the WhatsApp handoff still
   happens and nothing is lost from their point of view.

   Security: the policies in supabase/setup.sql let anyone INSERT a lead — that
   is what a contact form is — but only a signed-in account can read them back.
   A visitor cannot list other people's names and numbers.
   ========================================================================== */

import { isConfigured, loadClient, restUrl, restHeaders, LEADS_TABLE } from './supabase.js'

const KEY = 'kalasrotam.leads.v1'

/* ── Local mirror ─────────────────────────────────────────────────────────── */

export function getLocalLeads() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Private browsing, disabled storage, or corrupted JSON — never let this
    // break the form the visitor is trying to submit.
    return []
  }
}

export function saveLocalLead(lead) {
  const record = {
    ...lead,
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    at: new Date().toISOString(),
  }
  try {
    const all = getLocalLeads()
    all.unshift(record)
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)))
  } catch {
    /* Storage full or unavailable. The WhatsApp handoff still works. */
  }
  return record
}

export function clearLocalLeads() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to do */
  }
}

/* ── Submission ───────────────────────────────────────────────────────────── */

/**
 * Records an enquiry. Writes to the database when configured, and always keeps
 * a local copy.
 *
 * Deliberately never throws. A visitor who filled in a form correctly should
 * not be shown an error because of a backend problem they cannot do anything
 * about — the WhatsApp message is the real delivery mechanism, and it works
 * regardless.
 */
export async function submitLead(lead) {
  const clean = {
    type: lead.type || 'enquiry',
    name: lead.name?.trim() || null,
    phone: lead.phone?.trim() || null,
    email: lead.email?.trim() || null,
    medium: lead.medium || null,
    size: lead.size || null,
    budget: lead.budget || null,
    message: lead.message?.trim() || null,
  }

  saveLocalLead(clean)

  if (!isConfigured) return { ok: true, stored: 'local' }

  try {
    // Plain fetch: a visitor submitting a form should not have to download the
    // whole client library first.
    const res = await fetch(restUrl(LEADS_TABLE), {
      method: 'POST',
      headers: restHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      }),
      body: JSON.stringify(clean),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return { ok: true, stored: 'database' }
  } catch (err) {
    console.warn('[kalasrotam] Lead not saved to the database.', err?.message || err)
    return { ok: true, stored: 'local' }
  }
}

/** Reads enquiries back. Requires a signed-in account. */
export async function fetchLeads(limit = 200) {
  if (!isConfigured) return { leads: getLocalLeads(), source: 'local' }
  try {
    const client = await loadClient()
    if (!client) return { leads: getLocalLeads(), source: 'local' }
    const { data, error } = await client
      .from(LEADS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return { leads: (data || []).map((r) => ({ ...r, at: r.created_at })), source: 'database' }
  } catch (err) {
    console.warn('[kalasrotam] Could not read leads.', err?.message || err)
    return { leads: getLocalLeads(), source: 'local', error: err?.message }
  }
}

export async function deleteLead(id) {
  if (!isConfigured) return
  const client = await loadClient()
  if (!client) return
  const { error } = await client.from(LEADS_TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ── CSV export ───────────────────────────────────────────────────────────── */

const CSV_COLUMNS = ['at', 'type', 'name', 'phone', 'email', 'medium', 'size', 'budget', 'message']

function csvCell(value) {
  const s = value == null ? '' : String(value)
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefix a
  // quote so a lead named "=Ravi" cannot execute anything in your spreadsheet.
  const safe = /^[=+\-@]/.test(s) ? "'" + s : s
  return '"' + safe.replace(/"/g, '""') + '"'
}

export function leadsToCsv(leads) {
  const head = CSV_COLUMNS.join(',')
  const rows = leads.map((l) => CSV_COLUMNS.map((c) => csvCell(l[c])).join(','))
  return [head, ...rows].join('\r\n')
}

export function downloadCsv(leads) {
  const blob = new Blob(['﻿' + leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kalasrotam-leads-' + new Date().toISOString().slice(0, 10) + '.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ── Validation ───────────────────────────────────────────────────────────── */

/** Indian mobile numbers: 10 digits starting 6–9, with optional +91 / 0 prefix. */
export function validatePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  const local = digits.replace(/^(91|0)/, '')
  if (!local) return 'Please add a mobile number'
  if (local.length !== 10) return 'That should be 10 digits'
  if (!/^[6-9]/.test(local)) return 'Indian mobile numbers start with 6, 7, 8 or 9'
  return null
}

export function validateEmail(raw, { required = true } = {}) {
  const v = String(raw || '').trim()
  if (!v) return required ? 'Please add an email address' : null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email looks incomplete'
  return null
}

export function validateName(raw) {
  const v = String(raw || '').trim()
  if (!v) return 'Please add your name'
  if (v.length < 2) return 'That looks a little short'
  return null
}
