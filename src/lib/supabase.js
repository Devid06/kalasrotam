/* ============================================================================
   SUPABASE
   ----------------------------------------------------------------------------
   Configured through two environment variables — .env.local while developing,
   and the Cloudflare Pages dashboard for the live site:

       VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
       VITE_SUPABASE_ANON_KEY=eyJhbG...

   TWO WAYS IN, ON PURPOSE

   The public site talks to the database over plain REST with fetch(). Reading
   one row and inserting one row need nothing more than that, and it costs
   nothing to ship.

   The full client library — sessions, uploads, live updates — is loaded only
   when the admin panel opens. Bundling it for everyone added about 60KB gzipped
   to every single visit, paid for by people who will never edit anything. On
   Indian mobile data that is a real tax for a feature almost no visitor uses.

   ON THE ANON KEY BEING PUBLIC
   It is meant to be. It ships in the JavaScript and anyone can read it. Safety
   comes from the Row Level Security policies in supabase/setup.sql, which allow
   the public to READ content and INSERT an enquiry, and nothing else. Editing
   needs a signed-in account.

   Never put the service_role key here. It bypasses every policy, and anything
   prefixed VITE_ is public.
   ========================================================================== */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when both variables are present and look plausible. */
export const isConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 40
)

/* Where things live. Changing these means changing supabase/setup.sql too. */
export const CONTENT_TABLE = 'site_content'
export const CONTENT_ROW_ID = 1
export const LEADS_TABLE = 'leads'
export const BUCKET = 'artwork'

/* ── Lightweight REST path (public site) ──────────────────────────────────── */

export function restUrl(path) {
  return SUPABASE_URL + '/rest/v1/' + path
}

export function restHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
    ...extra,
  }
}

/* ── Full client (admin panel only) ───────────────────────────────────────────
   Dynamically imported and memoised, so the library is fetched once, the first
   time somebody actually opens the editor. */

let clientPromise = null

export function loadClient() {
  if (!isConfigured) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // The panel is opened with ?admin=1, never through a redirect
          // callback, so scanning the URL for tokens only risks surprises.
          detectSessionInUrl: false,
        },
      })
    )
  }
  return clientPromise
}

/** A short, readable explanation for the admin panel when setup is incomplete. */
export function configHint() {
  if (isConfigured) return null
  if (!SUPABASE_URL && !SUPABASE_ANON_KEY)
    return 'Not connected to Supabase yet — add the two keys to connect this site to its database.'
  if (!SUPABASE_URL) return 'VITE_SUPABASE_URL is missing.'
  if (!SUPABASE_ANON_KEY) return 'VITE_SUPABASE_ANON_KEY is missing.'
  return 'The Supabase keys look malformed — check they were pasted in full.'
}
