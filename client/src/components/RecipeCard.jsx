import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import { recipeImage } from '../api/recipes'
import { matchIngredients } from '../utils/ingredients'
import Icon from './Icon'
import { ErrorMessage } from './Feedback'

export default function RecipeCard({ meal }) {
  const { token, demo } = useAuth()
  const { pantry, favorites, toggleFavorite, requests } = useKitchen()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const match = matchIngredients(meal, pantry)
  const saved = favorites.some((item) => item.recipeId === meal.idMeal)

  async function onSave() {
    if (!token && !demo) {
      navigate('/login', {
        state: { from: location.pathname + location.search },
      })
      return
    }
    setBusy(true)
    setError(null)
    try {
      await toggleFavorite(meal)
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="recipe-card">
      <div className="recipe-photo-wrap">
        <Link to={`/recipes/${meal.idMeal}`} tabIndex={-1} aria-hidden="true">
          <img
            src={recipeImage(meal)}
            alt=""
            loading="lazy"
            className="recipe-photo"
            width="400"
            height="300"
          />
        </Link>
        <span className="photo-tag">{meal.strCategory}</span>
        <button
          className={`save-button ${saved ? 'is-saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${meal.strMeal}`}
          aria-pressed={saved}
          disabled={
            busy ||
            (!!token &&
              (requests.favorites.loading || !!requests.favorites.error))
          }
          onClick={onSave}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
      <div className="recipe-card-body">
        <div className="recipe-origin">
          <span>{meal.strArea || 'From the community'}</span>
          <span>RECIPE</span>
        </div>
        <h3>
          <Link to={`/recipes/${meal.idMeal}`}>{meal.strMeal}</Link>
        </h3>
        <div className="recipe-card-footer">
          {pantry.length > 0 ? (
            <span
              className={`match-label ${match.percentage >= 50 ? 'good-match' : ''}`}
            >
              <span className="match-dot" />
              {match.available.length} of {match.ingredients.length} ingredients
              in pantry
            </span>
          ) : (
            <span className="match-label">
              <Icon name="book" size={15} />
              {match.ingredients.length} ingredients
            </span>
          )}
          <Link
            to={`/recipes/${meal.idMeal}`}
            aria-label={`View ${meal.strMeal}`}
            className="recipe-arrow"
          >
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <ErrorMessage error={error} />
      </div>
    </article>
  )
}
