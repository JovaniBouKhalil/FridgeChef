import { useState } from 'react'
import { ErrorMessage, Spinner } from './Feedback'
import { focusFirstError, validateIngredient } from '../utils/validation'
import Icon from './Icon'
import {
  formatQuantity,
  measurementUnits,
  splitQuantity,
} from '../utils/quantities'

export default function IngredientForm({
  initial,
  onSave,
  onCancel,
  disabled = false,
}) {
  const [form, setForm] = useState({
    ingredientName: initial?.ingredientName || '',
    ...splitQuantity(initial?.quantity),
  })
  const [touched, setTouched] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const errors = validateIngredient(form)

  async function handleSubmit(event) {
    event.preventDefault()
    if (disabled || busy) return
    setTouched({ ingredientName: true, quantity: true })
    if (Object.keys(errors).length) {
      focusFirstError(event.currentTarget, errors)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave({
        ingredientName: form.ingredientName.trim(),
        quantity: formatQuantity(form.quantity, form.unit),
      })
      if (!initial) {
        setForm({ ingredientName: '', quantity: '', unit: '' })
        setTouched({})
      }
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }

  const unitId = initial ? `unit-${initial._id}` : 'unit'
  const quantityHintId = `${unitId}-hint`
  const savedUnit =
    form.unit && !measurementUnits.some(({ value }) => value === form.unit)

  function field(name, label, placeholder, maxLength) {
    const id = initial ? `${name}-${initial._id}` : name
    const fieldError = touched[name] && errors[name]
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          name={name}
          placeholder={placeholder}
          maxLength={maxLength}
          required
          disabled={disabled || busy}
          value={form[name]}
          autoFocus={!!initial && name === 'ingredientName'}
          aria-invalid={!!fieldError}
          aria-describedby={
            [fieldError && `${id}-error`, name === 'quantity' && quantityHintId]
              .filter(Boolean)
              .join(' ') || undefined
          }
          onBlur={() =>
            setTouched((previous) => ({ ...previous, [name]: true }))
          }
          onChange={(event) => {
            setForm({ ...form, [name]: event.target.value })
            setError(null)
          }}
        />
        <span
          className="field-error field-message"
          id={`${id}-error`}
          aria-live="polite"
        >
          {fieldError && (
            <>
              <Icon name="info" size={13} />
              {fieldError}
            </>
          )}
        </span>
      </div>
    )
  }

  return (
    <form
      className="ingredient-form"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={busy}
    >
      {field('ingredientName', 'Ingredient', 'e.g. Tomatoes', 80)}
      <div className="quantity-fields">
        {field('quantity', 'Quantity', 'e.g. 2 or 0.5', 50)}
        <div className="field">
          <label htmlFor={unitId}>Unit</label>
          <select
            id={unitId}
            name="unit"
            value={form.unit}
            disabled={disabled || busy}
            aria-describedby={quantityHintId}
            onChange={(event) => {
              setForm({ ...form, unit: event.target.value })
              setError(null)
            }}
          >
            {measurementUnits.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            {savedUnit && (
              <option value={form.unit}>{form.unit} (saved unit)</option>
            )}
          </select>
        </div>
      </div>
      <p className="quantity-hint" id={quantityHintId}>
        Use No unit for counts, like 2 tomatoes. For salt, try grams or
        teaspoons.
      </p>
      <button className="button" type="submit" disabled={disabled || busy}>
        {busy ? (
          <Spinner />
        ) : (
          <Icon name={initial ? 'check' : 'plus'} size={18} />
        )}
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
