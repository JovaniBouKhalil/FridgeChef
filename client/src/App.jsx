import { Link, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import KitchenProvider from './context/KitchenProvider'
import Layout from './components/Layout'
import DiscoverPage from './pages/DiscoverPage'
import PantryPage from './pages/PantryPage'
import RecipePage from './pages/RecipePage'
import FavoritesPage from './pages/FavoritesPage'
import ShoppingPage from './pages/ShoppingPage'
import AuthPage from './pages/AuthPage'
import { EmptyState } from './components/Feedback'
import './App.css'
import './interactions.css'

export default function App() {
  const { token, demo } = useAuth()
  return (
    <KitchenProvider key={token || (demo ? 'demo' : 'guest')}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DiscoverPage />} />
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
    </KitchenProvider>
  )
}
