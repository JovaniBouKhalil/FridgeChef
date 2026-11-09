import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import RecipeSearch from './RecipeSearch'

function SearchExample() {
  const [query, setQuery] = useState('')
  return (
    <>
      <RecipeSearch query={query} onSearch={setQuery} />
      <button>Outside search</button>
    </>
  )
}

it('supports keyboard selection, keeps input focus and remembers the chosen search', async () => {
  const user = userEvent.setup()
  render(<SearchExample />)
  const input = screen.getByRole('combobox', { name: 'Search recipes by name' })
  await user.click(input)
  expect(input).toHaveAttribute('aria-expanded', 'true')
  await user.keyboard('{ArrowDown}')
  const active = document.getElementById(
    input.getAttribute('aria-activedescendant'),
  )
  expect(active).toHaveAttribute('aria-selected', 'true')
  expect(active).toHaveTextContent('Pasta')
  await user.keyboard('{Enter}')
  expect(input).toHaveValue('Pasta')
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('aria-expanded', 'false')
  await user.click(screen.getByRole('button', { name: 'Find recipes' }))
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(
    JSON.parse(localStorage.getItem('fridgechef.recentSearches.v1')),
  ).toEqual(['Pasta'])
  await user.click(screen.getByRole('button', { name: 'Clear recipe search' }))
  expect(input).toHaveValue('')
})

it('removes recent searches and closes suggestions on Escape or outside focus', async () => {
  localStorage.setItem(
    'fridgechef.recentSearches.v1',
    JSON.stringify(['Lentil soup']),
  )
  const user = userEvent.setup()
  render(<SearchExample />)
  const input = screen.getByRole('combobox')
  await user.click(input)
  await user.click(
    screen.getByRole('button', { name: 'Remove recent search Lentil soup' }),
  )
  expect(
    JSON.parse(localStorage.getItem('fridgechef.recentSearches.v1')),
  ).toEqual([])
  expect(input).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(input).toHaveAttribute('aria-expanded', 'false')
  await user.click(input)
  await user.click(screen.getByRole('button', { name: 'Outside search' }))
  expect(input).toHaveAttribute('aria-expanded', 'false')
})

it('allows a free-text search when there are no matching suggestions', async () => {
  localStorage.setItem('fridgechef.recentSearches.v1', '{broken')
  const search = vi.fn()
  const user = userEvent.setup()
  render(<RecipeSearch query="" onSearch={search} />)
  await user.type(screen.getByRole('combobox'), 'Ribollita{Enter}')
  expect(search).toHaveBeenCalledWith('Ribollita')
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
})
