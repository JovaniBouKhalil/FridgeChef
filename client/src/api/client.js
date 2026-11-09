export const TOKEN_KEY = 'fridgechef.token'
export const USER_KEY = 'fridgechef.user'

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000'
).replace(/\/$/, '')
const MEALDB_URL = (
  import.meta.env.VITE_MEALDB_URL || 'https://www.themealdb.com/api/json/v1/1'
).replace(/\/$/, '')

// Chapter 20: config, headers, status checks and session expiry live in one place.
async function requestJSON(url, { authenticated = false, ...options } = {}) {
  const token = authenticated ? localStorage.getItem(TOKEN_KEY) : null
  let response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(20000)])
        : AbortSignal.timeout(20000),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error(
      'We couldn’t reach the service. Please check your connection and try again.',
      { cause: error },
    )
  }
  if (response.status === 401 && authenticated && token) {
    window.dispatchEvent(new Event('auth:expired'))
  }
  if (response.status === 204) return null
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      body?.error ||
        body?.message ||
        `Request failed (${response.status}). Please try again.`,
    )
  }
  if (body === null)
    throw new Error(
      'The service returned an unexpected response. Please try again.',
    )
  return body
}

export function apiFetch(path, options = {}) {
  return requestJSON(`${API_URL}${path}`, { authenticated: true, ...options })
}

// A separate origin never receives the user's token.
export function mealdbFetch(path, options = {}) {
  return requestJSON(`${MEALDB_URL}${path}`, options)
}
