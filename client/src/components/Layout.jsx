import { useEffect, useState } from 'react'
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useKitchen } from '../context/KitchenContext'
import Icon from './Icon'
import BackToTop from './BackToTop'

const navigation = [
  { to: '/', label: 'Discover recipes', short: 'Discover', icon: 'grid' },
  { to: '/pantry', label: 'My pantry', short: 'Pantry', icon: 'fridge' },
  { to: '/favorites', label: 'Saved recipes', short: 'Saved', icon: 'heart' },
  {
    to: '/shopping',
    label: 'Shopping list',
    short: 'Shopping',
    icon: 'basket',
  },
]

export default function Layout() {
  const { token, user, demo, logout, startDemo } = useAuth()
  const { pantry, favorites, shopping } = useKitchen()
  const location = useLocation()
  const navigate = useNavigate()
  const active = navigation.find((item) => item.to === location.pathname)
  const [recipeHeading, setRecipeHeading] = useState(null)
  const isRecipe = location.pathname.startsWith('/recipes/')
  const accountLabels = { '/login': 'Sign in', '/signup': 'Create an account' }
  let currentLabel =
    active?.label || accountLabels[location.pathname] || 'Page not found'
  if (isRecipe) {
    currentLabel =
      recipeHeading && location.pathname === `/recipes/${recipeHeading.id}`
        ? recipeHeading.title
        : 'Recipe details'
  }
  const counts = {
    '/pantry': pantry.length,
    '/favorites': favorites.length,
    '/shopping': shopping.filter((item) => !item.checked).length,
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location.pathname])

  useEffect(() => {
    document.title = `${currentLabel} · FridgeChef`
  }, [currentLabel])

  function openDemo() {
    startDemo()
    navigate('/pantry')
  }

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="FridgeChef home">
          <span className="brand-icon">
            <Icon name="chef" size={27} />
          </span>
          <span>
            Fridge<span className="brand-light">Chef</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {counts[item.to] > 0 && (
                <span className="nav-count">{counts[item.to]}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="kitchen-note">
            <h3>Use your pantry</h3>
            <p>
              Add the ingredients you have to find recipes that need fewer
              extras.
            </p>
            {!token && !demo && (
              <button className="text-button" onClick={openDemo}>
                Try the demo kitchen <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <Link className="mobile-brand" to="/" aria-label="FridgeChef home">
            <Icon name="chef" size={25} />
            <span>FridgeChef</span>
          </Link>
          <nav
            className={`breadcrumb ${isRecipe ? 'recipe-breadcrumb' : ''}`}
            aria-label="Breadcrumb"
          >
            <ol>
              <li>
                <Link to="/">{isRecipe ? 'Discover' : 'Your kitchen'}</Link>
              </li>
              <li className="breadcrumb-separator" aria-hidden="true">
                /
              </li>
              <li className="breadcrumb-current">
                <span aria-current="page" title={currentLabel}>
                  {currentLabel}
                </span>
              </li>
            </ol>
          </nav>
          <div className="topbar-actions">
            {token || demo ? (
              <>
                <span
                  className="avatar"
                  title={demo ? 'Demo kitchen' : user?.name || 'Home cook'}
                >
                  {demo
                    ? 'D'
                    : (user?.name || user?.email || 'C')
                        .slice(0, 1)
                        .toUpperCase()}
                </span>
                <button
                  className="icon-button"
                  aria-label={demo ? 'Exit demo' : 'Log out'}
                  title={demo ? 'Exit demo' : 'Log out'}
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <Icon name="logout" size={18} />
                </button>
              </>
            ) : (
              <Link to="/login" className="button button-small button-outline">
                Sign in <Icon name="arrow" size={15} />
              </Link>
            )}
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <Icon name="info" size={16} />
            <span>
              <strong>Demo kitchen.</strong> Changes stay in this browser.
            </span>
            <Link to="/signup">
              Create an account <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <main id="main-content" className="page-content" tabIndex="-1">
          <Outlet context={{ setRecipeHeading }} />
        </main>
        <footer className="page-footer">
          <span>FridgeChef</span>
          <span>
            Recipes & photography by{' '}
            <a
              href="https://www.themealdb.com"
              target="_blank"
              rel="noreferrer"
            >
              TheMealDB <span aria-hidden="true">↗</span>
            </a>
          </span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <Icon name={item.icon} size={20} />
            <span>{item.short}</span>
          </NavLink>
        ))}
      </nav>
      <BackToTop />
    </div>
  )
}
