import { useState } from 'react'
import { ErrorMessage } from './Feedback'
import Icon from './Icon'

export default function IngredientForm({
  initial,
  onSave,
  onCancel,
  disabled = false,
}) {
  const [form, setForm] = useState({
    ingredientName: initial?.ingredientName || '',
    quantity: initial?.quantity || '',
  })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.ingredientName.trim()) {
      setError('Enter an ingredient name.')
      return
    }
    if (!form.quantity.trim()) {
      setError('Add a quantity, such as 2 whole or 500 g.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        ingredientName: form.ingredientName.trim(),
        quantity: form.quantity.trim(),
      })
      if (!initial) setForm({ ingredientName: '', quantity: '' })
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="ingredient-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor={initial ? `ingredient-${initial._id}` : 'ingredient'}>
          Ingredient
        </label>
        <input
          id={initial ? `ingredient-${initial._id}` : 'ingredient'}
          name="ingredientName"
          placeholder="e.g. Tomatoes"
          maxLength={80}
          required
          disabled={disabled || busy}
          value={form.ingredientName}
          onChange={(event) =>
            setForm({ ...form, ingredientName: event.target.value })
          }
          autoFocus={!!initial}
        />
      </div>
      <div className="field">
        <label htmlFor={initial ? `quantity-${initial._id}` : 'quantity'}>
          Quantity
        </label>
        <input
          id={initial ? `quantity-${initial._id}` : 'quantity'}
          name="quantity"
          placeholder="e.g. 4 whole"
          maxLength={50}
          required
          disabled={disabled || busy}
          value={form.quantity}
          onChange={(event) =>
            setForm({ ...form, quantity: event.target.value })
          }
        />
      </div>
      <button className="button" type="submit" disabled={disabled || busy}>
        <Icon name={initial ? 'check' : 'plus'} size={18} />
        {busy ? 'Saving…' : initial ? 'Save changes' : 'Add ingredient'}
      </button>
      {onCancel && (
        <button
          className="button button-outline"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </button>
      )}
      <ErrorMessage error={error} />
    </form>
  )
}
