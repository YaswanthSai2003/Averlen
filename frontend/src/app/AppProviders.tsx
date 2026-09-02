import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'

import { Toaster } from '../components/ui'
import { AuthProvider } from '../features/auth/AuthProvider'

import { queryClient } from './queryClient'

export function AppProviders({
  children,
}: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>

      <Toaster />
    </QueryClientProvider>
  )
}