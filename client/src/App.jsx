import { Link, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import KitchenProvider from './context/KitchenProvider'
import Layout from './components/Layout'
import DiscoverPage from './pages/DiscoverPage'
import { EmptyState } from './components/Feedback'
import './App.css'
import './interactions.css'

const FeaturedRecipesPage = lazy(() => import('./pages/FeaturedRecipesPage'))
const PantryPage = lazy(() => import('./pages/PantryPage'))
const RecipePage = lazy(() => import('./pages/RecipePage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const ShoppingPage = lazy(() => import('./pages/ShoppingPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))

export default function App() {
  const { token, demo } = useAuth()
  return (
    <KitchenProvider key={token || (demo ? 'demo' : 'guest')}>
      <Suspense
        fallback={
          <p className="loading-text" role="status">
            Loading page...
          </p>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DiscoverPage />} />
            <Route
              path="featured"
              element={
                <Suspense
                  fallback={
                    <p className="loading-text" role="status">
                      Loading featured recipes…
                    </p>
                  }
                >
                  <FeaturedRecipesPage />
                </Suspense>
              }
            />
            <Route path="recipes/:id" element={<RecipePage />} />
            <Route path="login" element={<AuthPage key="login" />} />
            <Route
              path="signup"
              element={<AuthPage key="signup" mode="signup" />}
            />
            <Route element={<ProtectedRoute />}>
              <Route path="pantry" element={<PantryPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="shopping" element={<ShoppingPage />} />
            </Route>
            <Route
              path="*"
              element={
                <EmptyState title="This recipe took a different turn.">
                  <p>We couldn’t find that page.</p>
                  <Link to="/" className="button">
                    Back to the kitchen
                  </Link>
                </EmptyState>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </KitchenProvider>
  )
}
