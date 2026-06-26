const BASE = process.env.NEXT_PUBLIC_API_URL || ''

export function getToken(): string {
  if (typeof document === 'undefined') return ''
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
  return m ? m[1] : ''
}

export function setToken(token: string) {
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function clearToken() {
  document.cookie = 'token=; max-age=0; path=/'
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> || {}),
    },
  })
  if (res.status === 401) {
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as Record<string, string>).message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return {} as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)                 => req<T>(path),
  post:   <T>(path: string, body?: unknown) => req<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => req<T>(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(path: string)                 => req<T>(path, { method: 'DELETE' }),
}
