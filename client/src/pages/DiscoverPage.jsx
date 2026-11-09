import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import useRecipes from '../hooks/useRecipes'
import RecipeCard from '../components/RecipeCard'
import RecipeSearch from '../components/RecipeSearch'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import {
  EmptyState,
  ErrorMessage,
  RecipeSkeletons,
} from '../components/Feedback'

const categories = [
  'All recipes',
  'Vegetarian',
  'Chicken',
  'Seafood',
  'Pasta',
  'Dessert',
]

export default function DiscoverPage() {
  const { token, demo, startDemo } = useAuth()
  const { pantry, requests } = useKitchen()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const matches = params.get('matches') === 'true'
  const category = params.get('category') || 'All recipes'
  const [limit, setLimit] = useState(8)
  const { meals, loading, error, reload } = useRecipes({
    query,
    matches,
    pantry,
    demo,
  })
  const navigate = useNavigate()
  const filtered = meals.filter(
    (meal) => category === 'All recipes' || meal.strCategory === category,
  )

  function changeParams(values) {
    const next = new URLSearchParams(params)
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    )
    setParams(next)
    setLimit(8)
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Cook with what you have</h1>
          <p>Search by name, or use your pantry to find recipes that match.</p>
        </div>
      </div>

      <section
        className="discovery-workspace"
        aria-labelledby="recipes-heading"
      >
        <div className="recipe-explorer">
          <div className="section-title">
            <div>
              <h2 id="recipes-heading">Recipes</h2>
            </div>
            <span className="results-count">
              {loading ? 'Loading…' : `${filtered.length} results`}
            </span>
          </div>
          <RecipeSearch query={query} onSearch={(q) => changeParams({ q })} />
          <div className="recipe-filters">
            <div className="category-filters" aria-label="Recipe categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`filter-chip ${category === item ? 'active' : ''}`}
                  aria-pressed={category === item}
                  onClick={() =>
                    changeParams({
                      category: item === 'All recipes' ? '' : item,
                    })
                  }
                >
                  {item === 'Vegetarian' && <Icon name="leaf" size={14} />}
                  {item}
                </button>
              ))}
            </div>
            <button
              className={`pantry-toggle ${matches ? 'active' : ''}`}
              aria-pressed={matches}
              onClick={() => {
                if (!token && !demo) {
                  navigate('/login', { state: { from: '/?matches=true' } })
                  return
                }
                changeParams({ matches: matches ? '' : 'true' })
              }}
            >
              <Icon name="fridge" size={15} />
              Pantry matches
            </button>
          </div>
          {matches && (
            <p className="filter-explanation">
              {pantry.length ? (
                'Sorted by the ingredients in your pantry. Check the recipe for quantities; these results are a selection of available matches.'
              ) : (
                <>
                  Add a few ingredients to <Link to="/pantry">your pantry</Link>{' '}
                  to find meals that use them.
                </>
              )}
            </p>
          )}
          {matches && (
            <ErrorMessage
              error={requests.pantry.error}
              onRetry={requests.pantry.reload}
            />
          )}
          {query && (
            <p className="search-caption">
              Results for “{query}”{' '}
              <button
                className="text-button"
                onClick={() => {
                  changeParams({ q: '' })
                }}
              >
                Clear search <Icon name="close" size={13} />
              </button>
            </p>
          )}
          {loading ? (
            <RecipeSkeletons />
          ) : error ? (
            <>
              <ErrorMessage error={error} onRetry={reload} />
              {!demo && !token && (
                <button
                  className="button button-outline"
                  onClick={() => startDemo()}
                >
                  Explore sample recipes
                </button>
              )}
            </>
          ) : filtered.length ? (
            <>
              <div className="recipe-grid">
                {filtered.slice(0, limit).map((meal) => (
                  <RecipeCard key={meal.idMeal} meal={meal} />
                ))}
              </div>
              {filtered.length > limit && (
                <div className="load-more">
                  <button
                    className="button button-outline"
                    onClick={() => setLimit((value) => value + 8)}
                  >
                    Show more recipes <Icon name="plus" size={17} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="search" title="No recipes found">
              <p>Try a different name or choose another category.</p>
              <button
                className="button button-outline"
                onClick={() => {
                  setParams({})
                  setLimit(8)
                }}
              >
                See all recipes
              </button>
            </EmptyState>
          )}
        </div>

        <aside className="discovery-aside">
          <Reveal className="pantry-peek">
            <div className="aside-title">
              <span className="soft-icon">
                <Icon name="fridge" size={21} />
              </span>
              <h3>My pantry</h3>
            </div>
            {pantry.length ? (
              <>
                <div className="pantry-count">
                  <strong>{pantry.length}</strong>
                  <span>ingredients available</span>
                </div>
                <div className="ingredient-tags">
                  {pantry.slice(0, 5).map((item) => (
                    <span key={item._id}>{item.ingredientName}</span>
                  ))}
                  {pantry.length > 5 && <span>+{pantry.length - 5} more</span>}
                </div>
                <Link className="aside-link" to="/pantry">
                  Manage ingredients <Icon name="arrow" size={17} />
                </Link>
              </>
            ) : (
              <>
                <p>
                  Add what you have to see which ingredients you’re missing.
                </p>
                {token ? (
                  <Link to="/pantry" className="button button-outline">
                    Add your ingredients <Icon name="plus" size={16} />
                  </Link>
                ) : (
                  <button
                    className="button button-outline"
                    onClick={() => {
                      startDemo()
                      navigate('/pantry')
                    }}
                  >
                    Try demo pantry <Icon name="arrow" size={16} />
                  </button>
                )}
              </>
            )}
          </Reveal>
          <Link className="featured-recipe" to="/recipes/52771">
            <img
              src="/images/52771.jpg"
              alt="Spicy arrabiata penne"
              width="400"
              height="300"
              loading="lazy"
            />
            <span className="featured-caption">
              <span>Recipe to try</span>
              <strong>Spicy Arrabiata Penne</strong>
              <span>
                View recipe <Icon name="arrow" size={16} />
              </span>
            </span>
          </Link>
        </aside>
      </section>
    </>
  )
}
