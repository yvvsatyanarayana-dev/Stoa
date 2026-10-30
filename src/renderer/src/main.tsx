import './assets/main.css'
import './theme.css'

import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { useThemeStore } from './store/useThemeStore'

function ThemeInitializer() {
  useEffect(() => {
    useThemeStore.getState().initialize()
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeInitializer />
    <App />
  </StrictMode>
)