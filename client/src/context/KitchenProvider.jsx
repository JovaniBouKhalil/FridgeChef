import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import useApi from '../hooks/useApi'
import { demoKitchen } from '../data/demoKitchen'
import { readJSON } from '../utils/storage'
import { normalizeIngredient } from '../utils/ingredients'
import { KitchenContext } from './KitchenContext'

const DEMO_KEY = 'fridgechef.demoKitchen.v1'

// Mounted with a session key so private data is discarded on logout/user change.
export default function KitchenProvider({ children }) {
  const { token, demo } = useAuth()
  const [preview, setPreview] = useState(() => {
    const saved = readJSON(localStorage, DEMO_KEY, null)
    return saved &&
      ['pantry', 'favorites', 'shopping'].every((key) =>
        Array.isArray(saved[key]),
      )
      ? saved
      : demoKitchen
  })
  const pantryRequest = useApi('/api/pantry', { enabled: !!token })
  const favoritesRequest = useApi('/api/favorites', { enabled: !!token })
  const shoppingRequest = useApi('/api/shopping', { enabled: !!token })
  const requests = {
    pantry: pantryRequest,
    favorites: favoritesRequest,
    shopping: shoppingRequest,
  }

  useEffect(() => {
    if (demo) localStorage.setItem(DEMO_KEY, JSON.stringify(preview))
  }, [demo, preview])

  const pantry = demo ? preview.pantry : pantryRequest.data || []
  const favorites = demo ? preview.favorites : favoritesRequest.data || []
  const shopping = demo ? preview.shopping : shoppingRequest.data || []

  async function mutate(collection, method, values, id) {
    if (demo) {
      setPreview((previous) => ({
        ...previous,
        [collection]:
          method === 'POST'
            ? [...previous[collection], { ...values, _id: crypto.randomUUID() }]
            : method === 'DELETE'
              ? previous[collection].filter((item) => item._id !== id)
              : previous[collection].map((item) =>
                  item._id === id ? { ...item, ...values } : item,
                ),
      }))
      return
    }
    if (!token)
      throw new Error('Please sign in to save changes to your kitchen.')
    await apiFetch(
      `/api/${collection}${id ? `/${encodeURIComponent(id)}` : ''}`,
      {
        method,
        ...(values && { body: JSON.stringify(values) }),
      },
    )
    await requests[collection].reload()
  }

  async function toggleFavorite(meal) {
    const existing = favorites.find((item) => item.recipeId === meal.idMeal)
    return existing
      ? mutate('favorites', 'DELETE', null, existing._id)
      : mutate('favorites', 'POST', {
          recipeId: meal.idMeal,
          recipeName: meal.strMeal,
          recipeImage: meal.strMealThumb,
        })
  }

  async function addMissing(ingredients) {
    const existing = new Set(
      shopping.map((item) => normalizeIngredient(item.ingredientName)),
    )
    const unique = ingredients.filter((item) => {
      const name = normalizeIngredient(item.name)
      if (existing.has(name)) return false
      existing.add(name)
      return true
    })
    // Sequential writes preserve progress if an individual request fails.
    for (const item of unique) {
      await mutate('shopping', 'POST', {
        ingredientName: item.name,
        checked: false,
      })
    }
    return unique.length
  }

  return (
    <KitchenContext.Provider
      value={{
        pantry,
        favorites,
        shopping,
        requests,
        mutate,
        toggleFavorite,
        addMissing,
      }}
    >
      {children}
    </KitchenContext.Provider>
  )
}
