import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-700.css'
import '@fontsource/rubik/hebrew-400.css'
import '@fontsource/rubik/latin-400.css'
import '@fontsource/rubik/hebrew-500.css'
import '@fontsource/rubik/hebrew-700.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support and "add to home screen". Registration can fail in previews; the app works without it.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
