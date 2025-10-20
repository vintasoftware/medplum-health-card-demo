import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { MedplumClient } from '@medplum/core'
import { MedplumProvider } from '@medplum/react'
import './index.css'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import App from './App.tsx'

const medplum = new MedplumClient({
  baseUrl: import.meta.env.VITE_MEDPLUM_BASE_URL || 'https://api.medplum.com',
  onUnauthenticated: () => {
    console.log('Unauthenticated')
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MedplumProvider medplum={medplum}>
      <MantineProvider>
        <Notifications />
        <App />
      </MantineProvider>
    </MedplumProvider>
  </StrictMode>,
)
