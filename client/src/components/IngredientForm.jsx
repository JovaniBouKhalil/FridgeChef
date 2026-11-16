import { useState } from 'react'
import { ErrorMessage, Spinner } from './Feedback'
import { focusFirstError, validateIngredient } from '../utils/validation'
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
        quantity: form.quantity.trim(),
      })
      if (!initial) {
        setForm({ ingredientName: '', quantity: '' })
        setTouched({})
      }
    } catch (error) {
      setError(error)
    } finally {
      setBusy(false)
    }
  }

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
          aria-describedby={fieldError ? `${id}-error` : undefined}
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
      {field('quantity', 'Quantity', 'e.g. 4 whole', 50)}
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
