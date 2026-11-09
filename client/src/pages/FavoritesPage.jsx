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
          <p className="eyebrow">THE ONES YOU’LL COME BACK TO</p>
          <h1>A little collection of favorites.</h1>
          <p>For busy Tuesdays, slow Sundays, and everything in between.</p>
        </div>
        <Link className="button button-outline" to="/">
          Find more inspiration <Icon name="arrow" size={18} />
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
          <EmptyState icon="heart" title="Room for your next favorite.">
            <p>
              Tap the heart on a recipe you love.
              <br />
              We’ll keep it here for the next time you’re hungry.
            </p>
            <Link className="button" to="/">
              Discover recipes <Icon name="arrow" size={17} />
            </Link>
          </EmptyState>
        )
      )}
    </>
  )
}
