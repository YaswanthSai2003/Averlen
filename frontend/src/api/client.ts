import {
  env,
} from '../lib/env'


type ApiRequestOptions =
  Omit<
    RequestInit,
    'body'
  > & {
    body?: unknown

    skipAuthRefresh?:
      boolean
  }


type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
}


let accessToken:
  string |
  null = null


let refreshPromise:
  Promise<string | null> |
  null = null


let authFailureHandler:
  (() => void) |
  null = null


const SESSION_WATCH_INTERVAL_MS =
  15_000


let sessionWatchTimer:
  number |
  null = null


let sessionCheckPromise:
  Promise<void> |
  null = null


export class ApiError
  extends Error {
  readonly status:
    number

  readonly payload:
    unknown


  constructor(
    status:
      number,

    message:
      string,

    payload:
      unknown = null,
  ) {
    super(
      message,
    )

    this.name =
      'ApiError'

    this.status =
      status

    this.payload =
      payload
  }
}


export function setAccessToken(
  token:
    string |
    null,
) {
  accessToken =
    token

  if (token) {
    startSessionWatch()
  } else {
    stopSessionWatch()
  }
}


export function getAccessToken() {
  return accessToken
}


export function clearAccessToken() {
  accessToken =
    null

  stopSessionWatch()
}


export function setAuthFailureHandler(
  handler:
    (() => void) |
    null,
) {
  authFailureHandler =
    handler
}


function notifyAuthFailure() {
  clearAccessToken()

  authFailureHandler?.()
}


async function checkCurrentSession() {
  if (
    !accessToken ||
    sessionCheckPromise ||
    (
      typeof document !==
        'undefined' &&
      document.visibilityState !==
        'visible'
    )
  ) {
    return
  }

  sessionCheckPromise =
    apiRequest<unknown>(
      '/api/auth/me',
    )
      .then(
        () => undefined,
      )
      .catch(
        () => undefined,
      )
      .finally(
        () => {
          sessionCheckPromise =
            null
        },
      )

  await sessionCheckPromise
}


function handleSessionVisibilityChange() {
  if (
    typeof document !==
      'undefined' &&
    document.visibilityState ===
      'visible'
  ) {
    void checkCurrentSession()
  }
}


function startSessionWatch() {
  if (
    typeof window ===
      'undefined' ||
    sessionWatchTimer !==
      null
  ) {
    return
  }

  sessionWatchTimer =
    window.setInterval(
      () => {
        void checkCurrentSession()
      },
      SESSION_WATCH_INTERVAL_MS,
    )

  window.addEventListener(
    'focus',
    checkCurrentSession,
  )

  window.addEventListener(
    'online',
    checkCurrentSession,
  )

  if (
    typeof document !==
      'undefined'
  ) {
    document.addEventListener(
      'visibilitychange',
      handleSessionVisibilityChange,
    )
  }
}


function stopSessionWatch() {
  if (
    typeof window !==
      'undefined' &&
    sessionWatchTimer !==
      null
  ) {
    window.clearInterval(
      sessionWatchTimer,
    )
  }

  sessionWatchTimer =
    null

  if (
    typeof window !==
      'undefined'
  ) {
    window.removeEventListener(
      'focus',
      checkCurrentSession,
    )

    window.removeEventListener(
      'online',
      checkCurrentSession,
    )
  }

  if (
    typeof document !==
      'undefined'
  ) {
    document.removeEventListener(
      'visibilitychange',
      handleSessionVisibilityChange,
    )
  }
}


export function buildApiUrl(
  path: string,
): string {
  if (
    path.startsWith(
      'http://',
    ) ||
    path.startsWith(
      'https://',
    )
  ) {
    return path
  }


  const normalizedPath =
    path.startsWith(
      '/',
    )
      ? path
      : `/${path}`


  return (
    `${env.apiBaseUrl}${normalizedPath}`
  )
}


async function parseResponse(
  response:
    Response,
): Promise<unknown> {
  if (
    response.status ===
    204
  ) {
    return undefined
  }


  const contentType =
    response.headers.get(
      'content-type',
    ) ?? ''


  if (
    contentType.includes(
      'application/json',
    )
  ) {
    return response.json()
  }


  return response.text()
}


function getErrorMessage(
  status:
    number,

  payload:
    unknown,
) {
  if (
    typeof payload !==
      'object' ||
    payload === null ||
    !(
      'detail' in payload
    )
  ) {
    return (
      `Request failed with status ${status}`
    )
  }


  const detail =
    payload.detail


  if (
    typeof detail ===
    'string'
  ) {
    return detail
  }


  if (
    Array.isArray(
      detail,
    )
  ) {
    const messages =
      detail.flatMap(
        (item: unknown) => {
          if (
            typeof item !==
              'object' ||
            item === null ||
            !(
              'msg' in item
            ) ||
            typeof item.msg !==
              'string'
          ) {
            return []
          }


          const location =
            'loc' in item &&
            Array.isArray(
              item.loc,
            )
              ? item.loc
                  .slice(1)
                  .filter(
                    (
                      part:
                        unknown,
                    ) =>
                      typeof part ===
                        'string' ||
                      typeof part ===
                        'number',
                  )
                  .join(
                    '.',
                  )
              : ''


          return [
            location
              ? `${location}: ${item.msg}`
              : item.msg,
          ]
        },
      )


    if (
      messages.length >
      0
    ) {
      return messages.join(
        ' ',
      )
    }
  }


  switch (status) {
    case 500:
      return 'Something went wrong on the Averlen server. Please try again.'

    case 502:
      return 'Unable to reach Averlen services. Please try again in a moment.'

    case 503:
      return 'Averlen is temporarily unavailable. Please try again shortly.'

    case 504:
      return 'Averlen took too long to respond. Please try again.'

    default:
      return (
        `Request failed with status ${status}`
      )
  }
}


async function performRefresh():
  Promise<string | null> {
  try {
    const response =
      await fetch(
        buildApiUrl(
          '/api/auth/refresh',
        ),
        {
          method:
            'POST',

          credentials:
            'include',

          headers: {
            Accept:
              'application/json',
          },
        },
      )


    if (
      !response.ok
    ) {
      clearAccessToken()

      return null
    }


    const payload =
      (
        await response.json()
      ) as TokenResponse


    setAccessToken(
      payload.access_token,
    )


    return (
      payload.access_token
    )
  } catch {
    clearAccessToken()

    return null
  }
}


export function refreshAccessToken():
  Promise<string | null> {
  if (
    !refreshPromise
  ) {
    refreshPromise =
      performRefresh()
        .finally(
          () => {
            refreshPromise =
              null
          },
        )
  }


  return refreshPromise
}


async function executeRequest(
  path:
    string,

  options:
    ApiRequestOptions,

  token:
    string |
    null,
) {
  const {
    body,
    headers,
    skipAuthRefresh:
      _skipAuthRefresh,
    ...requestOptions
  } = options


  void _skipAuthRefresh


  const isFormData =
    body instanceof
    FormData


  const isUrlEncoded =
    body instanceof
    URLSearchParams


  const requestHeaders =
    new Headers(
      headers,
    )


  requestHeaders.set(
    'Accept',
    'application/json',
  )


  if (
    body !==
      undefined &&
    !isFormData &&
    !isUrlEncoded
  ) {
    requestHeaders.set(
      'Content-Type',
      'application/json',
    )
  }


  if (
    isUrlEncoded &&
    !requestHeaders.has(
      'Content-Type',
    )
  ) {
    requestHeaders.set(
      'Content-Type',
      'application/x-www-form-urlencoded',
    )
  }


  if (token) {
    requestHeaders.set(
      'Authorization',
      `Bearer ${token}`,
    )
  }


  return fetch(
    buildApiUrl(
      path,
    ),
    {
      ...requestOptions,

      credentials:
        'include',

      headers:
        requestHeaders,

      body:
        body ===
        undefined
          ? undefined
          : isFormData ||
              isUrlEncoded
            ? body
            : JSON.stringify(
                body,
              ),
    },
  )
}


export async function apiRequest<T>(
  path:
    string,

  options:
    ApiRequestOptions = {},
): Promise<T> {
  let response =
    await executeRequest(
      path,
      options,
      accessToken,
    )


  if (
    response.status ===
      401 &&
    !options.skipAuthRefresh
  ) {
    const refreshedToken =
      await refreshAccessToken()


    if (
      refreshedToken
    ) {
      response =
        await executeRequest(
          path,
          {
            ...options,

            skipAuthRefresh:
              true,
          },
          refreshedToken,
        )


      if (
        response.status ===
        401
      ) {
        notifyAuthFailure()
      }
    } else {
      notifyAuthFailure()
    }
  }


  const payload =
    await parseResponse(
      response,
    )


  if (
    !response.ok
  ) {
    throw new ApiError(
      response.status,

      getErrorMessage(
        response.status,
        payload,
      ),

      payload,
    )
  }


  return payload as T
}