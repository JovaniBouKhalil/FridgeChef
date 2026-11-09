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
  const { token, user, demo, startDemo } = useAuth()
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
          <p className="eyebrow">
            <span className="tiny-dot" /> A FRESH TAKE ON EVERYDAY COOKING
          </p>
          <h1>
            {user?.name
              ? `What’s cooking, ${user.name.split(' ')[0]}?`
              : 'A little inspiration for your kitchen.'}
          </h1>
          <p>Good meals start with what you already have.</p>
        </div>
        <span className="handwritten desktop-only">
          a pinch of possibility <span aria-hidden="true">↴</span>
        </span>
      </div>

      <Reveal
        as="section"
        className="discovery-hero"
        aria-labelledby="hero-title"
      >
        <div className="hero-copy">
          <span className="hero-kicker">
            <Icon name="leaf" size={16} /> LESS WASTE. MORE DELICIOUS.
          </span>
          <h2 id="hero-title">
            Your fridge.
            <br />
            Endless <em>possibilities.</em>
          </h2>
          <p>
            A few ingredients, a little inspiration, and something delicious.
            Let’s see what’s in your kitchen.
          </p>
          <Link to="/pantry" className="button button-cream">
            <Icon name="fridge" size={18} />
            Explore my pantry <Icon name="arrow" size={18} />
          </Link>
          <span className="hero-footnote">
            Small ingredients. Big potential.
          </span>
        </div>
        <div className="hero-image">
          <img
            src="/images/52771.jpg"
            alt="A bowl of spicy arrabiata penne with tomatoes and herbs"
            width="700"
            height="700"
            fetchPriority="high"
          />
          <div className="hero-recipe-note">
            <span className="hero-note-icon">
              <Icon name="chef" size={24} />
            </span>
            <div>
              <span>A LITTLE DINNER INSPIRATION</span>
              <Link to="/recipes/52771">
                Spicy Arrabiata Penne <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        </div>
        <span className="hero-sprig" aria-hidden="true">
          <Icon name="leaf" size={68} />
        </span>
      </Reveal>

      <section
        className="discovery-workspace"
        aria-labelledby="recipes-heading"
      >
        <div className="recipe-explorer">
          <div className="section-title">
            <div>
              <p className="eyebrow">FIND YOUR NEXT FAVORITE</p>
              <h2 id="recipes-heading">Something good is cooking.</h2>
            </div>
            <span className="results-count">
              {loading ? 'Finding inspiration…' : `${filtered.length} recipes`}
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
                'Ranked by ingredient names in your pantry. Quantities aren’t checked. Results are a selection, so there’s always more to discover.'
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
                    A little more inspiration <Icon name="plus" size={17} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState icon="search" title="No recipes on the menu yet.">
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
              <h3>Your pantry, at a glance</h3>
            </div>
            {pantry.length ? (
              <>
                <p>You’ve got good things to work with.</p>
                <div className="pantry-count">
                  <strong>{pantry.length}</strong>
                  <span>
                    ingredients
                    <br />
                    ready for a little magic
                  </span>
                </div>
                <div className="ingredient-tags">
                  {pantry.slice(0, 5).map((item) => (
                    <span key={item._id}>{item.ingredientName}</span>
                  ))}
                  {pantry.length > 5 && <span>+{pantry.length - 5} more</span>}
                </div>
                <Link className="aside-link" to="/pantry">
                  Take a look inside <Icon name="arrow" size={17} />
                </Link>
              </>
            ) : (
              <>
                <p>A delicious meal starts with a quick look in the fridge.</p>
                <div className="empty-pantry-art" aria-hidden="true">
                  <Icon name="fridge" size={65} />
                  <span>
                    <Icon name="leaf" size={22} />
                  </span>
                </div>
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
                    Try a demo pantry <Icon name="arrow" size={16} />
                  </button>
                )}
              </>
            )}
          </Reveal>
          <Reveal className="kitchen-tip">
            <span className="tip-kicker">
              <Icon name="sparkle" size={16} /> A LITTLE KITCHEN WISDOM
            </span>
            <h3>
              Give your ingredients
              <br />a second act.
            </h3>
            <p>
              Soft tomatoes? Perfect for sauce. A handful of herbs? Hello,
              pesto. The best ingredient is the one you use.
            </p>
            <span className="tip-doodle" aria-hidden="true">
              <Icon name="leaf" size={46} />
            </span>
          </Reveal>
          <p className="aside-footnote">
            <Icon name="heart" size={14} />
            Better for your plate.
            <br />A little kinder to the planet.
          </p>
        </aside>
      </section>
    </>
  )
}
