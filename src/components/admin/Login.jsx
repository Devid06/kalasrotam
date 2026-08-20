import { useState } from 'react'
import { configHint, isConfigured } from '../../lib/supabase.js'
import { CloseIcon } from '../ui.jsx'

/* The gate on the admin panel. Deliberately plain — this is a tool, not a page
   that needs to impress anybody. */

export default function Login({ onSignIn, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onSignIn(email, password)
    } catch (err) {
      setError(err.message || 'Could not sign in.')
      setBusy(false)
    }
  }

  return (
    <aside className="admin admin--login" aria-label="Sign in to edit">
      <header className="admin__bar">
        <div>
          <span className="admin__title">Sign in to edit</span>
          <span className="admin__sub">Kalasrotam studio</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="admin__x">
          <CloseIcon />
        </button>
      </header>

      <div className="admin__body">
        {!isConfigured ? (
          <div className="admin__warn" style={{ lineHeight: 1.6 }}>
            <strong>Not connected yet.</strong>
            <br />
            {configHint()}
            <br />
            <br />
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then reload. Until then the
            panel can still be used to preview changes on this device, but nothing can be published.
          </div>
        ) : (
          <form className="admin__login-form" onSubmit={submit}>
            <label className="af">
              <span className="af__label">Email</span>
              <input
                className="af__input"
                type="email"
                autoComplete="username"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="af">
              <span className="af__label">Password</span>
              <input
                className="af__input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && (
              <p className="admin__warn" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="abtn abtn--primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="af__hint">
              Accounts are created in the Supabase dashboard under Authentication → Users. There is no public sign-up.
            </p>
          </form>
        )}
      </div>
    </aside>
  )
}
