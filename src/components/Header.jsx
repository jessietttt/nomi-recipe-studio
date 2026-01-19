import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChefHat, LogOut, Plus, Calendar, Sparkles, Package, Menu, X, FlaskConical } from 'lucide-react'

export default function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => location.pathname.startsWith(path)

  const navLinks = [
    { to: '/', label: 'Recipes', icon: null, active: location.pathname === '/' || isActive('/recipes') },
    { to: '/menus', label: 'Menus', icon: Calendar, active: isActive('/menus') },
    { to: '/testing', label: 'Testing', icon: FlaskConical, active: isActive('/testing') },
    { to: '/ingredients', label: 'Pantry', icon: Package, active: isActive('/ingredients') },
    { to: '/inspiration', label: 'Inspiration', icon: Sparkles, active: isActive('/inspiration') },
  ]

  return (
    <header className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-900 flex items-center justify-center group-hover:bg-stone-800 transition-colors">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-stone-50" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-medium text-stone-900 tracking-tight">
                NOMI
              </span>
              <span className="text-xs sm:text-sm text-stone-500 italic">
                Studio
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                    link.active ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              to="/recipes/new"
              className="btn-primary flex items-center gap-2 text-sm py-2"
            >
              <Plus className="w-4 h-4" />
              Add Recipe
            </Link>

            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/recipes/new"
              className="btn-primary flex items-center gap-1 text-sm py-2 px-3"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                    link.active 
                      ? 'bg-stone-100 text-stone-900' 
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => {
                    signOut()
                    setMobileMenuOpen(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-stone-500 hover:text-stone-900 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
