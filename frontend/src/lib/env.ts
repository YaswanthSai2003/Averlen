const configuredApiBaseUrl =
  import.meta.env
    .VITE_API_BASE_URL
    ?.trim()
    .replace(/\/$/, '')

function resolveApiBaseUrl() {
  if (!configuredApiBaseUrl) {
    return ''
  }

  if (import.meta.env.DEV) {
    try {
      const configuredUrl =
        new URL(configuredApiBaseUrl)

      const isLocalBackend =
        configuredUrl.hostname === 'localhost' ||
        configuredUrl.hostname === '127.0.0.1'

      if (isLocalBackend) {
        return ''
      }
    } catch {
      return configuredApiBaseUrl
    }
  }

  return configuredApiBaseUrl
}

export const env = {
  apiBaseUrl:
    resolveApiBaseUrl(),
} as const
