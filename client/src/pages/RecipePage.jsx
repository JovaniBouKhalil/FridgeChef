import { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import { getRecipe, recipeImage } from '../api/recipes'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import { matchIngredients } from '../utils/ingredients'
import { ErrorMessage, Spinner } from '../components/Feedback'
import Reveal from '../components/Reveal'
import Icon from '../components/Icon'

function safeExternalLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export default function RecipePage() {
  const { id } = useParams()
  const { setRecipeHeading } = useOutletContext()
  const { token, demo } = useAuth()
  const { pantry, favorites, requests, toggleFavorite, addMissing } =
    useKitchen()
  const [state, setState] = useState({ meal: null, loading: true, error: null })
  const [actionError, setActionError] = useState(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [version, setVersion] = useState(0)
  const [celebrate, setCelebrate] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setState({ meal: null, loading: true, error: null })
      try {
        const meal = await getRecipe(id, { demo, signal: controller.signal })
        if (!controller.signal.aborted) {
          setState({ meal, loading: false, error: null })
          setRecipeHeading({ id, title: meal.strMeal })
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ meal: null, loading: false, error })
      }
    }
    load()
    return () => controller.abort()
  }, [id, demo, version, setRecipeHeading])

  async function act(action) {
    if (!token && !demo) {
      navigate('/login', { state: { from: `/recipes/${id}` } })
      return
    }
    setBusy(action)
    setActionError(null)
    setNotice('')
    try {
      if (action === 'save') {
        await toggleFavorite(state.meal)
        setCelebrate(!saved)
      } else {
        const count = await addMissing(
          matchIngredients(state.meal, pantry).missing,
        )
        setNotice(
          count
            ? `${count} ingredient${count === 1 ? '' : 's'} added to your shopping list.`
            : 'These ingredients are already on your shopping list.',
        )
      }
    } catch (error) {
      setActionError(error)
    } finally {
      setBusy('')
    }
  }

  if (state.loading)
    return (
      <p className="loading-text" role="status">
        <Spinner /> Loading recipe…
      </p>
    )
  if (state.error)
    return (
      <>
        <Link to="/" className="back-link">
          <Icon name="back" size={17} />
          Back to recipes
        </Link>
        <ErrorMessage
          error={state.error}
          onRetry={() => setVersion((value) => value + 1)}
        />
      </>
    )
  const { meal } = state
  const match = matchIngredients(meal, pantry)
  const saved = favorites.some((item) => item.recipeId === id)
  const instructions = (meal.strInstructions || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const source = safeExternalLink(meal.strSource)
  const video = safeExternalLink(meal.strYoutube)

  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="back" size={17} />
        Back to Discover
      </Link>
      <Reveal className="recipe-detail-hero">
        <div className="recipe-detail-photo">
          <img
            src={recipeImage(meal)}
            alt={meal.strMeal}
            width="600"
            height="600"
          />
        </div>
        <div className="recipe-detail-heading">
          <div className="detail-tags">
            <span>{meal.strCategory}</span>
            <span>
              <Icon name="globe" size={14} />
              {meal.strArea}
            </span>
          </div>
          <h1>{meal.strMeal}</h1>
          <div className="detail-stats">
            <span>
              <Icon name="book" size={20} />
              <strong>{match.ingredients.length}</strong> ingredients
            </span>
            {(token || demo) && (
              <span>
                <Icon name="fridge" size={20} />
                <strong>{match.available.length}</strong> in your pantry
              </span>
            )}
          </div>
          <button
            className={`button ${saved ? 'button-outline' : ''}`}
            onClick={() => act('save')}
            aria-pressed={saved}
            aria-busy={busy === 'save'}
            disabled={
              !!busy ||
              (!!token &&
                (requests.favorites.loading || !!requests.favorites.error))
            }
          >
            {busy === 'save' ? (
              <Spinner />
            ) : (
              <span
                className={celebrate ? 'heart-confirmation' : ''}
                onAnimationEnd={() => setCelebrate(false)}
              >
                <Icon name="heart" size={18} />
              </span>
            )}
            {busy === 'save'
              ? 'Saving…'
              : saved
                ? 'Saved to your recipes'
                : 'Save this recipe'}
          </button>
          <p className="detail-attribution">
            Recipe & photography from TheMealDB
          </p>
        </div>
      </Reveal>
      <ErrorMessage error={actionError} />
      <div className="recipe-detail-content">
        <section className="panel ingredient-panel">
          <div className="section-title">
            <h2>Ingredients</h2>
            <span className="number-badge">{match.ingredients.length}</span>
          </div>
          {token || demo ? (
            <>
              <p className="muted">
                {match.available.length} in your pantry · {match.missing.length}{' '}
                to pick up
              </p>
              <div
                className="match-track"
                aria-label={`${match.percentage}% of ingredient names in your pantry`}
              >
                <span style={{ width: `${match.percentage}%` }} />
              </div>
              <ErrorMessage
                error={requests.pantry.error}
                onRetry={requests.pantry.reload}
              />
            </>
          ) : (
            <p className="muted">
              <Link to="/login" state={{ from: `/recipes/${id}` }}>
                Sign in
              </Link>{' '}
              to compare with your pantry.
            </p>
          )}
          <ul className="recipe-ingredients">
            {match.ingredients.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <span
                  className={`ingredient-status ${item.available ? 'available' : ''}`}
                >
                  <Icon name={item.available ? 'check' : 'plus'} size={14} />
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.measure}</span>
                </div>
                {item.available && (
                  <span className="in-pantry-label">In pantry</span>
                )}
              </li>
            ))}
          </ul>
          {match.missing.length > 0 && (
            <button
              className="button button-full"
              onClick={() => act('shopping')}
              aria-busy={busy === 'shopping'}
              disabled={
                !!busy ||
                (!!token &&
                  (requests.pantry.loading ||
                    requests.shopping.loading ||
                    !!requests.pantry.error ||
                    !!requests.shopping.error))
              }
            >
              {busy === 'shopping' ? (
                <Spinner />
              ) : (
                <Icon name="basket" size={18} />
              )}
              {busy === 'shopping'
                ? 'Adding ingredients…'
                : 'Add missing to shopping list'}
            </button>
          )}
          {notice && (
            <div className="success-message" role="status">
              <Icon name="check" size={19} />
              <div>
                {notice} <Link to="/shopping">View shopping list</Link>
              </div>
            </div>
          )}
          <ErrorMessage
            error={requests.shopping.error}
            onRetry={requests.shopping.reload}
          />
          <p className="ingredient-disclaimer">
            Matches compare ingredient names. Check quantities and dietary needs
            before cooking.
          </p>
        </section>
        <section className="method-panel">
          <h2>Instructions</h2>
          <ol className="method-steps">
            {instructions.map((step, index) => (
              <li key={index}>
                <span className="step-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          {(source || video) && (
            <div className="recipe-source-links">
              {source && (
                <a
                  className="button button-outline"
                  href={source}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original recipe <span aria-hidden="true">↗</span>
                </a>
              )}
              {video && (
                <a
                  className="text-button"
                  href={video}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch the recipe <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
