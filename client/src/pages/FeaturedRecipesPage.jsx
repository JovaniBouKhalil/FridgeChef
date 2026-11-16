import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import FeaturedRecipeCarousel from '@/components/ui/demo'
import meals from '../data/demoMeals.json'
import { recipeIngredients } from '../utils/ingredients'
import { recipeImage } from '../api/recipes'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import { ErrorMessage, Spinner } from '../components/Feedback'

const selection = [
  {
    id: '52771',
    title: 'Spicy arrabiata',
    subtitle: 'Penne',
    accent: '#e9c8a5',
  },
  {
    id: '52959',
    title: 'Fennel & tomato',
    subtitle: 'Salmon',
    accent: '#d5e3b7',
  },
  { id: '52854', title: 'Weekend', subtitle: 'Pancakes', accent: '#f0dda4' },
  {
    id: '52977',
    title: 'Turkish lentil',
    subtitle: 'Corba',
    accent: '#efcca2',
  },
  {
    id: '52772',
    title: 'Teriyaki chicken',
    subtitle: 'Casserole',
    accent: '#c7dfd2',
  },
]
const dishes = selection.map((item) => {
  const meal = meals.find((meal) => meal.idMeal === item.id)
  const paragraph = meal.strInstructions
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
  return {
    ...item,
    image: recipeImage(meal),
    alt: meal.strMeal,
    label: meal.strMeal,
    eyebrow: `${meal.strCategory} · ${meal.strArea}`,
    source: 'TheMealDB',
    ingredients: recipeIngredients(meal).map((ingredient) => ingredient.name),
    description:
      paragraph.length > 190
        ? `${paragraph.slice(0, 187).replace(/\s+\S*$/, '')}…`
        : paragraph,
    video: meal.strYoutube,
  }
})

export default function FeaturedRecipesPage() {
  const { token, demo } = useAuth()
  const { favorites, toggleFavorite, requests } = useKitchen()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  async function save(dish) {
    if (!token && !demo) {
      navigate('/login', { state: { from: '/featured' } })
      return
    }
    const meal = meals.find((meal) => meal.idMeal === dish.id)
    const saved = favorites.some((item) => item.recipeId === dish.id)
    setBusy(dish.id)
    setError(null)
    setNotice('')
    try {
      await toggleFavorite(meal)
      setNotice(
        `${meal.strMeal} ${saved ? 'removed from saved recipes' : 'saved to your recipes'}.`,
      )
    } catch (error) {
      setError(error)
    } finally {
      setBusy('')
    }
  }

  function play(dish) {
    try {
      const url = new URL(dish.video)
      if (
        url.protocol === 'https:' &&
        ['www.youtube.com', 'youtube.com', 'youtu.be'].includes(url.hostname)
      )
        window.open(url.href, '_blank', 'noopener,noreferrer')
    } catch {
      setError(
        new Error(
          'This recipe video is unavailable. Open the full recipe instead.',
        ),
      )
    }
  }

  return (
    <div className="featured-page">
      <div className="page-heading">
        <div>
          <h1>Featured recipes</h1>
          <p>
            Browse a few ideas, then open a recipe for ingredients and
            instructions.
          </p>
        </div>
        <Link to="/" className="button button-outline">
          Browse all recipes
        </Link>
      </div>
      <FeaturedRecipeCarousel
        dishes={dishes}
        backdrop="/images/orbit/kitchen-wall.webp"
        onOrder={(dish) => navigate(`/recipes/${dish.id}`)}
        onPlay={play}
        renderAction={(dish) => {
          const saved = favorites.some((item) => item.recipeId === dish.id)
          return (
            <button
              type="button"
              className="featured-save"
              aria-pressed={saved}
              aria-busy={busy === dish.id}
              disabled={
                !!busy ||
                (!!token &&
                  (requests.favorites.loading || !!requests.favorites.error))
              }
              onClick={() => save(dish)}
            >
              {busy === dish.id ? <Spinner /> : <Heart size={17} />}
              {busy === dish.id
                ? 'Saving…'
                : saved
                  ? 'Saved recipe'
                  : 'Save recipe'}
            </button>
          )
        }}
      />
      <ErrorMessage
        error={error || requests.favorites.error}
        onRetry={
          requests.favorites.error ? requests.favorites.reload : undefined
        }
      />
      <span className="sr-only" role="status">
        {notice}
      </span>
    </div>
  )
}
