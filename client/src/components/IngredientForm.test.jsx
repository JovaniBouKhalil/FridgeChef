import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import IngredientForm from './IngredientForm'

it('waits until blur to show field errors and focuses the first invalid field on submit', async () => {
  const save = vi.fn()
  const user = userEvent.setup()
  render(<IngredientForm onSave={save} />)
  const ingredient = screen.getByLabelText('Ingredient')
  await user.click(ingredient)
  expect(
    screen.queryByText('Enter an ingredient name.'),
  ).not.toBeInTheDocument()
  await user.tab()
  expect(screen.getByText('Enter an ingredient name.')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
  expect(ingredient).toHaveFocus()
  expect(save).not.toHaveBeenCalled()
})

it('shows pending state for the real save promise and blocks duplicate submission', async () => {
  let finish
  const save = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const user = userEvent.setup()
  render(<IngredientForm onSave={save} />)
  await user.type(screen.getByLabelText('Ingredient'), 'Carrots')
  await user.type(screen.getByLabelText('Quantity'), '3 whole')
  await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
  const pending = screen.getByRole('button', { name: 'Saving…' })
  expect(pending).toBeDisabled()
  expect(pending.closest('form')).toHaveAttribute('aria-busy', 'true')
  await user.click(pending)
  expect(save).toHaveBeenCalledOnce()
  await act(async () => finish())
  expect(screen.getByRole('button', { name: 'Add ingredient' })).toBeEnabled()
  expect(screen.getByLabelText('Ingredient')).toHaveValue('')
  expect(
    screen.queryByText('Enter an ingredient name.'),
  ).not.toBeInTheDocument()
})
