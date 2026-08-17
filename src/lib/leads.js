/* ============================================================================
   LEADS — local storage
   ----------------------------------------------------------------------------
   You chose "store locally for now", so every enquiry and signup is saved in
   this browser's localStorage. Two things to know:

     • Leads are saved on the VISITOR's device, not yours. You will not see
       them. What you actually receive is the WhatsApp message the form opens.
     • Add ?admin=1 to the URL on your own machine to see and export whatever
       has been captured in that browser — useful for testing the forms.

   WHEN YOU WANT REAL LEAD CAPTURE
   Replace the body of `submitRemote` below with a fetch() to a form service
   (Formspree, Getform, Google Apps Script). The forms already await it and
   already show error states, so nothing else needs to change.
   ========================================================================== */

const KEY = 'kalasrotam.leads.v1'

/* ── Store ────────────────────────────────────────────────────────────────── */

export function getLeads() {
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

export function saveLead(lead) {
  const record = { ...lead, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, at: new Date().toISOString() }
  try {
    const all = getLeads()
    all.unshift(record)
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, 500)))
  } catch {
    /* Storage full or unavailable. The WhatsApp handoff still works. */
  }
  return record
}

export function clearLeads() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to do */
  }
}

/**
 * The single swap point for a real backend.
 * Today: resolves immediately after the local save.
 * Tomorrow: `await fetch('https://formspree.io/f/YOUR_ID', {...})`.
 */
export async function submitRemote(lead) {
  saveLead(lead)
  return { ok: true }
}

/* ── CSV export (used by the ?admin=1 panel) ──────────────────────────────── */

const CSV_COLUMNS = ['at', 'type', 'name', 'phone', 'email', 'medium', 'size', 'budget', 'message', 'artwork']

function csvCell(value) {
  const s = value == null ? '' : String(value)
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefix a
  // quote so a lead named "=Ravi" cannot execute anything in your spreadsheet.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
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
  a.download = `kalasrotam-leads-${new Date().toISOString().slice(0, 10)}.csv`
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
