import { Suspense, lazy, useEffect, useState } from 'react'

/* ============================================================================
   ADMIN GATE
   ----------------------------------------------------------------------------
   Deliberately tiny. Its only job is to notice ?admin=1 and, only then, pull in
   the editor.

   This split is not cosmetic. Everything the editor needs — the Supabase client
   library, the auth session, the form widgets — is roughly 57KB gzipped. An
   earlier version imported the editor directly and called its hooks before the
   ?admin=1 check. Because React hooks must run unconditionally, that fired the
   auth check for every visitor and pulled the whole library down on a page view
   that would never edit anything.

   Keeping the gate in its own module means the editor is a separate chunk that
   is fetched the first time somebody actually asks to edit, and never
   otherwise.
   ========================================================================== */

const Editor = lazy(() => import('./Editor.jsx'))

export default function AdminPanel() {
  const [wanted, setWanted] = useState(false)

  useEffect(() => {
    setWanted(new URLSearchParams(window.location.search).get('admin') === '1')
  }, [])

  if (!wanted) return null

  return (
    <Suspense fallback={null}>
      <Editor />
    </Suspense>
  )
}
