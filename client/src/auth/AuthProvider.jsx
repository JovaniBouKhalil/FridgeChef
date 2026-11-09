import { useCallback, useEffect, useState } from 'react'
import { apiFetch, TOKEN_KEY, USER_KEY } from '../api/client'
import { readJSON } from '../utils/storage'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => readJSON(localStorage, USER_KEY, null))
  const [demo, setDemo] = useState(
    () =>
      !localStorage.getItem(TOKEN_KEY) &&
      sessionStorage.getItem('fridgechef.demo') === 'true',
  )
  const [expired, setExpired] = useState(false)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem('fridgechef.demo')
    setToken(null)
    setUser(null)
    setDemo(false)
  }, [])

  useEffect(() => {
    function onExpiry() {
      logout()
      setExpired(true)
    }
    window.addEventListener('auth:expired', onExpiry)
    return () => window.removeEventListener('auth:expired', onExpiry)
  }, [logout])

  async function authenticate(mode, values) {
    const data = await apiFetch(`/api/auth/${mode}`, {
      authenticated: false,
      method: 'POST',
      body: JSON.stringify(values),
    })
    if (!data.token || !data.user)
      throw new Error('The sign-in response is incomplete. Please try again.')
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    sessionStorage.removeItem('fridgechef.demo')
    setToken(data.token)
    setUser(data.user)
    setDemo(false)
    setExpired(false)
  }

  function startDemo() {
    sessionStorage.setItem('fridgechef.demo', 'true')
    setDemo(true)
    setExpired(false)
  }

  return (
    <AuthContext.Provider
      value={{ token, user, demo, expired, authenticate, logout, startDemo }}
    >
      {children}
    </AuthContext.Provider>
  )
}
