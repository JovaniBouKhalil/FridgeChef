import { useEffect, useState } from 'react'
import { searchRecipes } from '../api/recipes'

export default function useRecipes({ query, matches, pantry, demo }) {
  const [state, setState] = useState({ meals: [], loading: true, error: null })
  const [version, setVersion] = useState(0)
  const pantryKey = JSON.stringify(pantry.map((item) => item.ingredientName))

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: null }))
      try {
        const meals = await searchRecipes({
          query,
          matches,
          demo,
          signal: controller.signal,
          pantry: JSON.parse(pantryKey).map((ingredientName) => ({
            ingredientName,
          })),
        })
        if (!controller.signal.aborted)
          setState({ meals, loading: false, error: null })
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ meals: [], loading: false, error })
      }
    }
    load()
    return () => controller.abort()
  }, [query, matches, demo, pantryKey, version])

  return { ...state, reload: () => setVersion((value) => value + 1) }
}
