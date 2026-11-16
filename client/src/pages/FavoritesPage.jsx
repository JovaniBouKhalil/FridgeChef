import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import { getRecipe } from '../api/recipes'
import RecipeCard from '../components/RecipeCard'
import {
  EmptyState,
  ErrorMessage,
  RecipeSkeletons,
} from '../components/Feedback'
import Icon from '../components/Icon'

export default function FavoritesPage() {
  const { demo } = useAuth()
  const { favorites, requests } = useKitchen()
  const [state, setState] = useState({ meals: [], loading: true, error: null })
  const [version, setVersion] = useState(0)
  const ids = JSON.stringify(favorites.map((item) => item.recipeId))

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: null }))
      try {
        const meals = await Promise.all(
          JSON.parse(ids).map((id) =>
            getRecipe(id, { demo, signal: controller.signal }),
          ),
        )
        if (!controller.signal.aborted)
          setState({ meals, loading: false, error: null })
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ meals: [], loading: false, error })
      }
    }
    load()
    return () => controller.abort()
  }, [ids, demo, version])

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Saved recipes</h1>
          <p>Recipes you’ve saved for later.</p>
        </div>
        <Link className="button button-outline" to="/">
          Browse recipes <Icon name="arrow" size={18} />
        </Link>
      </div>
      <ErrorMessage
        error={requests.favorites.error}
        onRetry={requests.favorites.reload}
      />
      <ErrorMessage
        error={state.error}
        onRetry={() => setVersion((value) => value + 1)}
      />
      {requests.favorites.loading || state.loading ? (
        <RecipeSkeletons />
      ) : state.meals.length ? (
        <div className="recipe-grid favorites-grid">
          {state.meals.map((meal) => (
            <RecipeCard key={meal.idMeal} meal={meal} />
          ))}
        </div>
      ) : (
        !state.error &&
        !requests.favorites.error && (
          <EmptyState icon="heart" title="No saved recipes">
            <p>Use the heart button on a recipe to save it here.</p>
            <Link className="button" to="/">
              Discover recipes <Icon name="arrow" size={17} />
            </Link>
          </EmptyState>
        )
      )}
    </>
  )
}
