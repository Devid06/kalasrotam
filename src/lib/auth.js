/* ============================================================================
   ADMIN AUTHENTICATION
   ----------------------------------------------------------------------------
   Editing used to be gated by nothing more than ?admin=1 in the URL. That was
   acceptable while edits lived only in the editor's own browser and publishing
   meant uploading a file by hand.

   It is not acceptable now. Publishing writes straight to the live site, so the
   panel needs a real login — and the real enforcement is not here in the
   JavaScript, it is in the Row Level Security policies on the database. Even if
   somebody forced this UI open, every write would still be rejected without a
   valid session. This module just makes the gate visible and usable.
   ========================================================================== */

import { useCallback, useEffect, useState } from 'react'
import { isConfigured, loadClient } from './supabase.js'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setChecking(false)
      return
    }

    let active = true
    let unsubscribe = null

    loadClient().then((client) => {
      if (!client || !active) {
        setChecking(false)
        return
      }

      client.auth.getSession().then(({ data }) => {
        if (!active) return
        setSession(data?.session ?? null)
        setChecking(false)
      })

      // Fires on sign in, sign out, and silent token refreshes, so a session
      // that expires mid-edit updates the UI instead of failing on the next
      // save.
      const { data: sub } = client.auth.onAuthStateChange((_event, next) => {
        if (active) setSession(next)
      })
      unsubscribe = () => sub?.subscription?.unsubscribe()
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!isConfigured) throw new Error('Not connected to Supabase')
    const client = await loadClient()
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(friendlyAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    if (!isConfigured) return
    const client = await loadClient()
    await client?.auth.signOut()
  }, [])

  return {
    session,
    user: session?.user ?? null,
    isSignedIn: Boolean(session),
    checking,
    signIn,
    signOut,
  }
}

/** Supabase's messages are accurate but terse. These are for a human. */
function friendlyAuthError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'That email and password do not match an account.'
  if (m.includes('email not confirmed')) return 'That account still needs its email confirmed.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts — wait a minute and try again.'
  if (m.includes('network') || m.includes('fetch')) return 'Could not reach the server. Check your connection.'
  return message || 'Could not sign in.'
}
