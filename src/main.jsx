import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { resolveContent } from './lib/content.jsx'
import './styles/base.css'
import './styles/sections.css'

/* Content is resolved BEFORE the first render, not in an effect afterwards.
   Loading it after mount would show the built-in defaults for a moment and
   then swap them for the published ones — a visible flicker of the wrong
   prices on every visit. */
const layers = await resolveContent()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App layers={layers} />
  </StrictMode>
)
