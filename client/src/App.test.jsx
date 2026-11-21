import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import App from './App'
import AuthProvider from './auth/AuthProvider'
import { TOKEN_KEY, USER_KEY } from './api/client'

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

it('protects the pantry and validates signup before calling the API', async () => {
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()
  renderApp('/pantry')
  expect(
    await screen.findByRole('heading', { name: 'Sign in' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('link', { name: 'Create an account' }))
  await user.click(screen.getByRole('button', { name: 'Create account' }))
  expect(screen.getByText('Enter your password.')).toBeInTheDocument()
  expect(screen.getByLabelText('Email address')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(fetchMock).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Name')).toHaveFocus()
})

it('uses the loaded recipe name in the breadcrumb and links back to discovery', async () => {
  sessionStorage.setItem('fridgechef.demo', 'true')
  const user = userEvent.setup()
  renderApp('/recipes/52771')
  await screen.findByRole('heading', { name: 'Spicy Arrabiata Penne' })
  const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(breadcrumb).getByText('Spicy Arrabiata Penne')).toHaveAttribute(
    'aria-current',
    'page',
  )
  await user.click(
    within(breadcrumb).getByRole('link', { name: 'Discover', exact: true }),
  )
  expect(screen.getByRole('heading', { name: 'Recipes' })).toBeInTheDocument()
})

it('adds and edits a demo ingredient and keeps it after remounting', async () => {
  sessionStorage.setItem('fridgechef.demo', 'true')
  const user = userEvent.setup()
  const app = renderApp('/pantry')
  await user.type(await screen.findByLabelText('Ingredient'), 'Carrots')
  await user.type(screen.getByLabelText('Quantity'), '3')
  await user.selectOptions(screen.getByLabelText('Unit'), 'whole')
  await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
  expect(screen.getByText('Carrots')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Edit Carrots' }))
  const edit = screen.getByDisplayValue('3')
  await user.clear(edit)
  await user.type(edit, '5')
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(screen.getByText('5 whole')).toBeInTheDocument()
  app.unmount()
  renderApp('/pantry')
  expect(await screen.findByText('Carrots')).toBeInTheDocument()
  expect(screen.getByText('5 whole')).toBeInTheDocument()
})

it('adds only missing ingredients to shopping and does not add duplicates', async () => {
  sessionStorage.setItem('fridgechef.demo', 'true')
  const user = userEvent.setup()
  renderApp('/recipes/52771')
  await screen.findByRole('heading', { name: 'Spicy Arrabiata Penne' })
  await user.click(
    screen.getByRole('button', { name: 'Add missing to shopping list' }),
  )
  await screen.findByText(/ingredients added to your shopping list/)
  const firstCount = JSON.parse(
    localStorage.getItem('fridgechef.demoKitchen.v1'),
  ).shopping.length
  expect(firstCount).toBeGreaterThan(0)
  await user.click(
    screen.getByRole('button', { name: 'Add missing to shopping list' }),
  )
  await screen.findByText(
    'These ingredients are already on your shopping list.',
  )
  expect(
    JSON.parse(localStorage.getItem('fridgechef.demoKitchen.v1')).shopping,
  ).toHaveLength(firstCount)
  await user.click(screen.getByRole('link', { name: 'View shopping list' }))
  const list = await screen.findByRole('list', {
    name: 'Shopping ingredients',
  })
  const checkbox = within(list).getAllByRole('checkbox')[0]
  await user.click(checkbox)
  expect(checkbox).toBeChecked()
})

it('sends login and pantry requests to Express and clears private state on expiry', async () => {
  const fetchMock = vi.fn(async (url, options) => {
    if (url.endsWith('/api/auth/login')) {
      expect(JSON.parse(options.body)).toEqual({
        email: 'cook@example.com',
        password: 'password123',
      })
      return new Response(
        JSON.stringify({
          token: 'real-token',
          user: { name: 'Cook', email: 'cook@example.com' },
        }),
      )
    }
    return new Response(
      JSON.stringify(
        url.endsWith('/api/pantry')
          ? [
              {
                _id: '1',
                ingredientName: 'Private garlic',
                quantity: '2 bulbs',
              },
            ]
          : [],
      ),
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()
  renderApp('/pantry')
  await user.type(screen.getByLabelText('Email address'), 'cook@example.com')
  await user.type(screen.getByLabelText('Password'), 'password123')
  await user.click(screen.getByRole('button', { name: 'Sign in', exact: true }))
  await screen.findByText('Private garlic')
  expect(localStorage.getItem(TOKEN_KEY)).toBe('real-token')
  expect(
    fetchMock.mock.calls.find(([url]) => url.endsWith('/api/pantry'))[1].headers
      .Authorization,
  ).toBe('Bearer real-token')
  act(() => window.dispatchEvent(new Event('auth:expired')))
  await screen.findByRole('heading', { name: 'Sign in' })
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(localStorage.getItem(USER_KEY)).toBeNull()
  expect(screen.queryByText('Private garlic')).not.toBeInTheDocument()
  await waitFor(() =>
    expect(screen.getByText(/Your session has expired/)).toBeInTheDocument(),
  )
})

it('demo checks add ingredients once, keep pantry amounts, and persist after clearing shopping', async () => {
  sessionStorage.setItem('fridgechef.demo', 'true')
  localStorage.setItem(
    'fridgechef.demoKitchen.v1',
    JSON.stringify({
      pantry: [
        { _id: 'tomato', ingredientName: 'Tomatoes', quantity: '500 g' },
      ],
      favorites: [],
      shopping: [
        { _id: 'tomatos', ingredientName: 'TOmatos', checked: false },
        { _id: 'salt', ingredientName: 'Salt', checked: false },
      ],
    }),
  )
  const user = userEvent.setup()
  const app = renderApp('/shopping')
  const readKitchen = () =>
    JSON.parse(localStorage.getItem('fridgechef.demoKitchen.v1'))
  await user.click(await screen.findByRole('checkbox', { name: 'TOmatos' }))
  expect(readKitchen().pantry).toHaveLength(1)
  expect(readKitchen().pantry[0].quantity).toBe('500 g')
  const salt = screen.getByRole('checkbox', { name: 'Salt' })
  await user.click(salt)
  await user.click(salt)
  await user.click(salt)
  expect(readKitchen().pantry).toHaveLength(2)
  expect(readKitchen().pantry[1]).toMatchObject({
    ingredientName: 'Salt',
    quantity: 'Not specified',
  })
  await user.click(screen.getByRole('button', { name: 'Clear picked up' }))
  expect(readKitchen().shopping).toHaveLength(0)
  app.unmount()
  renderApp('/pantry')
  expect(await screen.findByText('Salt')).toBeInTheDocument()
  expect(screen.getByText('500 g')).toBeInTheDocument()
})

it('refreshes the signed-in pantry after checking a shopping item', async () => {
  localStorage.setItem(TOKEN_KEY, 'test-token')
  localStorage.setItem(USER_KEY, JSON.stringify({ name: 'Cook' }))
  let purchased = false
  const fetchMock = vi.fn(async (url, options = {}) => {
    if (url.includes('/api/shopping') && options.method === 'PATCH')
      purchased = true
    const item = { _id: 'salt', ingredientName: 'Salt', checked: purchased }
    return new Response(
      JSON.stringify(
        url.endsWith('/api/pantry')
          ? purchased
            ? [{ ...item, quantity: 'Not specified' }]
            : []
          : url.endsWith('/api/favorites')
            ? []
            : options.method === 'PATCH'
              ? item
              : [item],
      ),
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  const user = userEvent.setup()
  renderApp('/shopping')
  await user.click(await screen.findByRole('checkbox', { name: 'Salt' }))
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/pantry')),
    ).toHaveLength(2),
  )
  await user.click(screen.getByRole('link', { name: /My pantry/ }))
  expect(await screen.findByText('Salt')).toBeInTheDocument()
  expect(screen.getByText('Not specified')).toBeInTheDocument()
})
