import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AppProviders } from './app/AppProviders'
import { AppRouter } from './app/AppRouter'
import './styles/index.css'


import {
  BackendWakeGate,
} from './features/system'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <BackendWakeGate>
        <AppRouter />
      </BackendWakeGate>
    </AppProviders>
  </StrictMode>,
)