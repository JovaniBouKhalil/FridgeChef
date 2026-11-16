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
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
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
  await user.type(screen.getByLabelText('Ingredient'), 'Carrots')
  await user.type(screen.getByLabelText('Quantity'), '3 whole')
  await user.click(screen.getByRole('button', { name: 'Add ingredient' }))
  expect(screen.getByText('Carrots')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Edit Carrots' }))
  const edit = screen.getByDisplayValue('3 whole')
  await user.clear(edit)
  await user.type(edit, '5 whole')
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(screen.getByText('5 whole')).toBeInTheDocument()
  app.unmount()
  renderApp('/pantry')
  expect(screen.getByText('Carrots')).toBeInTheDocument()
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
  const list = screen.getByRole('list', { name: 'Shopping ingredients' })
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
