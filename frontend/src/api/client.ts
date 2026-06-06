export class ApiError extends Error {
  readonly status: number
  readonly detail: unknown

  constructor(message: string, status: number, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const apiClient = {
  get<T>(path: string, options: Pick<RequestOptions, 'query'> = {}) {
    return request<T>(path, options)
  },

  post<T>(path: string, body: unknown) {
    return request<T>(path, {
      method: 'POST',
      body,
    })
  },

  patch<T>(path: string, body: unknown) {
    return request<T>(path, {
      method: 'PATCH',
      body,
    })
  },

  delete<T>(path: string) {
    return request<T>(path, {
      method: 'DELETE',
    })
  },
}

type QueryParams = Record<string, string | number | boolean | null | undefined>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: QueryParams
  body?: unknown
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers:
      options.body === undefined
        ? undefined
        : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const detail = await readResponseBody(response)
    throw new ApiError(
      resolveErrorMessage(detail, response.status),
      response.status,
      detail,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(
    `${trimTrailingSlash(API_BASE_URL)}${path}`,
    window.location.origin,
  )

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

function trimTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function resolveErrorMessage(detail: unknown, status: number): string {
  if (isObjectWithDetail(detail) && typeof detail.detail === 'string') {
    return detail.detail
  }

  return `Request failed with status ${status}`
}

function isObjectWithDetail(value: unknown): value is { detail: unknown } {
  return typeof value === 'object' && value !== null && 'detail' in value
}
