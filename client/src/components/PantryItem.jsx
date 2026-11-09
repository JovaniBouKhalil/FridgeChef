import { useState } from 'react'
import { useKitchen } from '../context/KitchenContext'
import IngredientForm from './IngredientForm'
import { ErrorMessage, Spinner } from './Feedback'
import Icon from './Icon'
import { normalizeIngredient } from '../utils/ingredients'

export default function PantryItem({ item }) {
  const { mutate, pantry } = useKitchen()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await mutate('pantry', 'DELETE', null, item._id)
    } catch (error) {
      setError(error)
      setBusy(false)
    }
  }

  return (
    <li className="pantry-item">
      {editing ? (
        <IngredientForm
          initial={item}
          onCancel={() => setEditing(false)}
          onSave={async (values) => {
            if (
              pantry.some(
                (other) =>
                  other._id !== item._id &&
                  normalizeIngredient(other.ingredientName) ===
                    normalizeIngredient(values.ingredientName),
              )
            ) {
              throw new Error(
                'This ingredient is already in your pantry. Edit its quantity instead.',
              )
            }
            await mutate('pantry', 'PATCH', values, item._id)
            setEditing(false)
          }}
        />
      ) : (
        <>
          <span className="ingredient-avatar">
            <Icon name="leaf" size={21} />
          </span>
          <div className="ingredient-description">
            <strong>{item.ingredientName}</strong>
            <span>{item.quantity}</span>
          </div>
          {confirmDelete ? (
            <div className="item-actions">
              <span>Remove?</span>
              <button
                className="text-button danger"
                disabled={busy}
                onClick={remove}
              >
                {busy && <Spinner />}Yes, remove
              </button>
              <button
                className="icon-button"
                disabled={busy}
                aria-label={`Keep ${item.ingredientName}`}
                onClick={() => setConfirmDelete(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ) : (
            <div className="item-actions">
              <button
                className="icon-button"
                aria-label={`Edit ${item.ingredientName}`}
                onClick={() => setEditing(true)}
              >
                <Icon name="edit" size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={`Remove ${item.ingredientName}`}
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={18} />
              </button>
            </div>
          )}
        </>
      )}
      <ErrorMessage error={error} />
    </li>
  )
}
