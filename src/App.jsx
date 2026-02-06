import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import Login from './pages/Login'
import RecipeLibrary from './pages/RecipeLibrary'
import RecipeDetail from './pages/RecipeDetail'
import RecipeForm from './pages/RecipeForm'
import MenuList from './pages/MenuList'
import MenuForm from './pages/MenuForm'
import MenuDetail from './pages/MenuDetail'
import InspirationStudio from './pages/InspirationStudio'
import Ingredients from './pages/Ingredients'
import TestingScheduler from './pages/TestingScheduler'
import TestingRounds from './pages/TestingRounds'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Layout with header for authenticated pages
function AuthenticatedLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50 texture-overlay">
      <Header />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  )
}

// Main App with routes
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public route */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <RecipeLibrary />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recipes/new"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <RecipeForm />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recipes/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <RecipeDetail />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recipes/:id/edit"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <RecipeForm />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menus"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MenuList />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menus/new"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MenuForm />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menus/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MenuDetail />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/menus/:id/edit"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <MenuForm />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inspiration"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <InspirationStudio />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ingredients"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <Ingredients />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/testing"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <TestingScheduler />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/testing/rounds"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <TestingRounds />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
