import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useKitchen } from '../context/KitchenContext'
import IngredientForm from '../components/IngredientForm'
import PantryItem from '../components/PantryItem'
import { EmptyState, ErrorMessage } from '../components/Feedback'
import { normalizeIngredient } from '../utils/ingredients'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'
import { Spinner } from '../components/Feedback'

export default function PantryPage() {
  const { pantry, requests, mutate } = useKitchen()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  useEffect(() => {
    if (adding) document.getElementById('ingredientName')?.focus()
  }, [adding])
  const request = requests.pantry
  const filtered = pantry.filter((item) =>
    item.ingredientName.toLowerCase().includes(search.toLowerCase()),
  )

  async function addIngredient(values) {
    if (
      pantry.some(
        (item) =>
          normalizeIngredient(item.ingredientName) ===
          normalizeIngredient(values.ingredientName),
      )
    )
      throw new Error(
        'This ingredient is already in your pantry. Edit its quantity instead.',
      )
    await mutate('pantry', 'POST', values)
    if (adding) {
      setAdding(false)
      document
        .getElementById('pantry-list-title')
        ?.focus({ preventScroll: true })
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>My pantry</h1>
          <p>Keep your ingredients up to date for better recipe matches.</p>
        </div>
        <div className="pantry-actions">
          <button
            type="button"
            className="button mobile-add-button"
            aria-label={adding ? 'Hide ingredient form' : 'Add an ingredient'}
            aria-expanded={adding}
            aria-controls="pantry-add-form"
            onClick={() => setAdding((value) => !value)}
          >
            <Icon name={adding ? 'close' : 'plus'} size={18} />
            {adding ? 'Close form' : 'Add ingredient'}
          </button>
          <Link className="button button-outline" to="/?matches=true">
            Find recipes <Icon name="arrow" size={18} />
          </Link>
        </div>
      </div>
      <div className="pantry-layout">
        <Reveal
          as="section"
          id="pantry-add-form"
          className={`panel pantry-add-panel ${adding ? 'is-open' : ''}`}
        >
          <div className="panel-heading">
            <span className="soft-icon">
              <Icon name="plus" />
            </span>
            <div>
              <h2>Add an ingredient</h2>
              <p>Add an ingredient and how much you have.</p>
            </div>
          </div>
          <IngredientForm
            onSave={addIngredient}
            disabled={request.loading || !!request.error}
          />
          <div className="small-note">
            <Icon name="info" size={17} />
            <p>
              Use simple names like “Garlic” or “Tomatoes” to help us match your
              ingredients with recipes.
            </p>
          </div>
        </Reveal>
        <Reveal as="section" className="panel pantry-list-panel">
          <div className="section-title">
            <h2 id="pantry-list-title" tabIndex="-1">
              Ingredients <span className="number-badge">{pantry.length}</span>
            </h2>
            <Icon name="fridge" size={22} />
          </div>
          <div className="list-search">
            <Icon name="search" size={18} />
            <label className="sr-only" htmlFor="pantry-search">
              Search your pantry
            </label>
            <input
              id="pantry-search"
              type="search"
              placeholder="Find an ingredient…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <ErrorMessage error={request.error} onRetry={request.reload} />
          {request.loading ? (
            <p className="loading-text" role="status">
              <Spinner /> Opening your pantry…
            </p>
          ) : filtered.length ? (
            <ul className="pantry-list">
              {filtered.map((item) => (
                <PantryItem key={item._id} item={item} />
              ))}
            </ul>
          ) : (
            !request.error && (
              <EmptyState
                icon="fridge"
                title={
                  search ? 'No ingredients found.' : 'Your pantry is empty'
                }
              >
                <p>
                  {search
                    ? 'Try another ingredient name.'
                    : 'Add your first ingredient using the form.'}
                </p>
              </EmptyState>
            )
          )}
        </Reveal>
      </div>
    </>
  )
}
