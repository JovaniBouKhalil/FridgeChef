import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useKitchen } from '../context/KitchenContext'
import { normalizeIngredient } from '../utils/ingredients'
import { EmptyState, ErrorMessage, Spinner } from '../components/Feedback'
import Icon from '../components/Icon'

function ShoppingItem({ item }) {
  const { mutate } = useKitchen()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  async function change(method) {
    setBusy(true)
    setError(null)
    try {
      await mutate(
        'shopping',
        method,
        method === 'PATCH' ? { checked: !item.checked } : null,
        item._id,
      )
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }
  return (
    <li className={`shopping-item ${item.checked ? 'checked' : ''}`}>
      <label>
        <input
          type="checkbox"
          checked={item.checked}
          disabled={busy}
          onChange={() => change('PATCH')}
        />
        <span>{item.ingredientName}</span>
      </label>
      <button
        className="icon-button"
        aria-label={`Remove ${item.ingredientName}`}
        disabled={busy}
        onClick={() => change('DELETE')}
      >
        {busy ? <Spinner /> : <Icon name="close" size={18} />}
      </button>
      <ErrorMessage error={error} />
    </li>
  )
}

export default function ShoppingPage() {
  const { shopping, mutate, requests } = useKitchen()
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState('')
  const [touched, setTouched] = useState(false)
  const nameError =
    touched && !name.trim() ? 'Enter an ingredient for your shopping list.' : ''
  const checked = shopping.filter((item) => item.checked).length

  async function add(event) {
    event.preventDefault()
    if (busy) return
    setTouched(true)
    if (!name.trim()) {
      event.currentTarget.elements.namedItem('ingredientName')?.focus()
      return
    }
    if (
      shopping.some(
        (item) =>
          normalizeIngredient(item.ingredientName) ===
          normalizeIngredient(name),
      )
    ) {
      setError('This ingredient is already on your list.')
      return
    }
    setBusy('add')
    setError(null)
    try {
      await mutate('shopping', 'POST', {
        ingredientName: name.trim(),
        checked: false,
      })
      setName('')
      setTouched(false)
    } catch (error) {
      setError(error)
    } finally {
      setBusy('')
    }
  }

  async function clearChecked() {
    setBusy('clear')
    setError(null)
    try {
      for (const item of shopping.filter((item) => item.checked))
        await mutate('shopping', 'DELETE', null, item._id)
    } catch (error) {
      setError(error)
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Shopping list</h1>
          <p>
            Add what you need, or bring in missing ingredients from a recipe.
          </p>
        </div>
        <Link to="/" className="button button-outline">
          Find a recipe <Icon name="arrow" size={18} />
        </Link>
      </div>
      <div className="shopping-layout">
        <section className="panel shopping-panel">
          <div className="section-title">
            <h2>
              To buy{' '}
              <span className="number-badge">{shopping.length - checked}</span>
            </h2>
            {checked > 0 && (
              <button
                className="text-button"
                disabled={busy}
                onClick={clearChecked}
              >
                {busy === 'clear' && <Spinner />}Clear picked up
              </button>
            )}
          </div>
          <form
            className="shopping-add-form"
            onSubmit={add}
            noValidate
            aria-busy={busy === 'add'}
          >
            <label htmlFor="shopping-ingredient" className="sr-only">
              Add to shopping list
            </label>
            <input
              id="shopping-ingredient"
              name="ingredientName"
              placeholder="Anything else you need?"
              value={name}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'shopping-name-error' : undefined}
              onBlur={() => setTouched(true)}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
            <button
              className="button"
              disabled={
                busy || requests.shopping.loading || !!requests.shopping.error
              }
              type="submit"
            >
              {busy === 'add' ? <Spinner /> : <Icon name="plus" size={18} />}
              {busy === 'add' ? 'Adding…' : 'Add'}
            </button>
          </form>
          {nameError && (
            <p
              className="field-error shopping-field-error"
              id="shopping-name-error"
              aria-live="polite"
            >
              <Icon name="info" size={13} />
              {nameError}
            </p>
          )}
          <ErrorMessage error={error} />
          <ErrorMessage
            error={requests.shopping.error}
            onRetry={requests.shopping.reload}
          />
          {requests.shopping.loading ? (
            <p role="status" className="loading-text">
              <Spinner /> Getting your list ready…
            </p>
          ) : shopping.length ? (
            <>
              <div className="shopping-progress">
                <span>
                  {checked} of {shopping.length} picked up
                </span>
                <div className="match-track">
                  <span
                    style={{ width: `${(checked / shopping.length) * 100}%` }}
                  />
                </div>
              </div>
              <ul className="shopping-list" aria-label="Shopping ingredients">
                {shopping.map((item) => (
                  <ShoppingItem key={item._id} item={item} />
                ))}
              </ul>
            </>
          ) : (
            !requests.shopping.error && (
              <EmptyState icon="basket" title="Your shopping list is empty">
                <p>
                  Add an ingredient above, or open a recipe
                  <br />
                  to add everything you’re missing.
                </p>
                <Link to="/" className="text-button">
                  Find something to cook <Icon name="arrow" size={16} />
                </Link>
              </EmptyState>
            )
          )}
        </section>
        <aside className="shopping-note">
          <Icon name="basket" size={38} />
          <h2>Add missing ingredients</h2>
          <p>
            Open a recipe and choose “Add missing to shopping list”. Items
            already on this list won’t be added again.
          </p>
          <p className="small-text">
            Check quantities in the recipe before shopping.
          </p>
          <Link to="/pantry" className="text-button">
            Check my pantry <Icon name="arrow" size={16} />
          </Link>
        </aside>
      </div>
    </>
  )
}
