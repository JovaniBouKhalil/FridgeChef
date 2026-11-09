import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useKitchen } from '../context/KitchenContext'
import IngredientForm from '../components/IngredientForm'
import PantryItem from '../components/PantryItem'
import { EmptyState, ErrorMessage } from '../components/Feedback'
import { normalizeIngredient } from '../utils/ingredients'
import Icon from '../components/Icon'

export default function PantryPage() {
  const { pantry, requests, mutate } = useKitchen()
  const [search, setSearch] = useState('')
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
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE ORGANIZATION, A LOT OF POSSIBILITY</p>
          <h1>Good things in your pantry.</h1>
          <p>Keep track of what you have. Make room for something delicious.</p>
        </div>
        <Link className="button" to="/?matches=true">
          Find my next meal <Icon name="arrow" size={18} />
        </Link>
      </div>
      <div className="pantry-layout">
        <section className="panel">
          <div className="panel-heading">
            <span className="soft-icon">
              <Icon name="plus" />
            </span>
            <div>
              <h2>What’s in your kitchen?</h2>
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
        </section>
        <section className="panel pantry-list-panel">
          <div className="section-title">
            <h2>
              Your ingredients{' '}
              <span className="number-badge">{pantry.length}</span>
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
              Opening your pantry…
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
                  search
                    ? 'No ingredients found.'
                    : 'A fresh start for your fridge.'
                }
              >
                <p>
                  {search
                    ? 'Try another ingredient name.'
                    : 'Add your first ingredient and let’s see what you can cook.'}
                </p>
              </EmptyState>
            )
          )}
        </section>
      </div>
      <div className="bottom-note">
        <Icon name="leaf" size={25} />
        <div>
          <strong>The best place to start? What’s already there.</strong>
          <p>
            Check your fridge, cupboards, and that little jar at the back of the
            shelf.
          </p>
        </div>
      </div>
    </>
  )
}
