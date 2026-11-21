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
  await user.type(screen.getByLabelText('Quantity'), '3')
  await user.selectOptions(screen.getByLabelText('Unit'), 'whole')
  await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
  const pending = screen.getByRole('button', { name: 'Saving…' })
  expect(pending).toBeDisabled()
  expect(pending.closest('form')).toHaveAttribute('aria-busy', 'true')
  await user.click(pending)
  expect(save).toHaveBeenCalledOnce()
  expect(save).toHaveBeenCalledWith({
    ingredientName: 'Carrots',
    quantity: '3 whole',
  })
  expect(screen.getByLabelText('Unit')).toBeDisabled()
  await act(async () => finish())
  expect(screen.getByRole('button', { name: 'Add ingredient' })).toBeEnabled()
  expect(screen.getByLabelText('Ingredient')).toHaveValue('')
  expect(screen.getByLabelText('Unit')).toHaveValue('')
  expect(
    screen.queryByText('Enter an ingredient name.'),
  ).not.toBeInTheDocument()
})

it.each([
  ['Salt', '0.5', 'tsp', '0.5 tsp'],
  ['Tomatoes', '2', '', '2'],
])(
  'saves %s with its selected measurement or no unit',
  async (ingredientName, quantity, unit, expected) => {
    const save = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<IngredientForm onSave={save} />)
    await user.type(screen.getByLabelText('Ingredient'), ingredientName)
    await user.type(screen.getByLabelText('Quantity'), quantity)
    await user.selectOptions(screen.getByLabelText('Unit'), unit)
    await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
    expect(save).toHaveBeenCalledWith({ ingredientName, quantity: expected })
  },
)

it.each([
  '500 g',
  '2 bulbs',
  '2 boxes',
  '1 litre',
  '1/2 cup',
  'to taste',
  'Not specified',
])('preserves the saved quantity %s when editing', async (quantity) => {
  const save = vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(
    <IngredientForm
      initial={{ _id: 'saved', ingredientName: 'Salt', quantity }}
      onSave={save}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(save).toHaveBeenCalledWith({ ingredientName: 'Salt', quantity })
})
