import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, mealdbFetch, TOKEN_KEY } from './client'

beforeEach(() => vi.stubGlobal('fetch', vi.fn()))

describe('shared API client', () => {
  it('attaches the saved bearer token to private requests', async () => {
    localStorage.setItem(TOKEN_KEY, 'test-token')
    fetch.mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))
    await apiFetch('/api/pantry')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/pantry',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })
  it('never sends the private token to the recipe provider', async () => {
    localStorage.setItem(TOKEN_KEY, 'private-token')
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ meals: [] }), { status: 200 }),
    )
    await mealdbFetch('/search.php?s=pasta')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
  it('accepts a 204 delete without attempting to parse JSON', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }))
    expect(await apiFetch('/api/pantry/1', { method: 'DELETE' })).toBeNull()
  })
  it('raises auth:expired for an authenticated 401 and preserves the API message', async () => {
    const expired = vi.fn()
    localStorage.setItem(TOKEN_KEY, 'expired-token')
    window.addEventListener('auth:expired', expired)
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
      }),
    )
    await expect(apiFetch('/api/pantry')).rejects.toThrow('Session expired')
    expect(expired).toHaveBeenCalledOnce()
    window.removeEventListener('auth:expired', expired)
  })
})
