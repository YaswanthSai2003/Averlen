import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      visibleToasts={4}
      toastOptions={{
        duration: 4000,
      }}
    />
  )
}