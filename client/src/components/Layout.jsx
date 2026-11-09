import { useEffect } from 'react'
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
  const counts = {
    '/pantry': pantry.length,
    '/favorites': favorites.length,
    '/shopping': shopping.filter((item) => !item.checked).length,
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = `${active?.label || (location.pathname.startsWith('/recipes/') ? 'Recipe' : 'Your kitchen')} · FridgeChef`
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location.pathname, active?.label])

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
            fridge<span className="brand-light">chef</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="sidebar-label">YOUR EVERYDAY KITCHEN</div>
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
            <span className="note-leaf">
              <Icon name="leaf" size={25} />
            </span>
            <h3>
              A little less waste.
              <br />A lot more possibility.
            </h3>
            <p>Your next great meal might already be in your fridge.</p>
            {!token && !demo && (
              <button className="text-button" onClick={openDemo}>
                Try the demo kitchen <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
          <div className="sidebar-footer">
            <span className="tiny-dot" />
            Made for real-life cooking
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Your kitchen <span>/</span>{' '}
            <strong>
              {active?.label ||
                (location.pathname.startsWith('/recipes/')
                  ? 'Recipe details'
                  : 'Welcome')}
            </strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-note">
              <Icon name="leaf" size={15} />
              Cook more. Waste less.
            </span>
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
              <strong>Demo kitchen.</strong> Sample recipes and pantry. Changes
              stay in this browser.
            </span>
            <Link to="/signup">
              Create an account <Icon name="arrow" size={14} />
            </Link>
          </div>
        )}
        <main id="main-content" className="page-content" tabIndex="-1">
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>Good food. Less waste. More you.</span>
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
    </div>
  )
}
