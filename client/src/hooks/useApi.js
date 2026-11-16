import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch } from '../api/client'

// Chapter 20: the hook owns loading/error/data; pages own their presentation.
export default function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: null,
  })
  const activeRequest = useRef(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    activeRequest.current?.abort()
    const controller = new AbortController()
    activeRequest.current = controller
    setState((previous) => ({ ...previous, loading: true, error: null }))
    try {
      const data = await apiFetch(path, { signal: controller.signal })
      if (!controller.signal.aborted)
        setState({ data, loading: false, error: null })
    } catch (error) {
      if (!controller.signal.aborted)
        setState((previous) => ({ ...previous, loading: false, error }))
    }
  }, [path, enabled])

  useEffect(() => {
    reload()
    return () => activeRequest.current?.abort()
  }, [reload])

  return { ...state, loading: enabled && state.loading, reload }
}
