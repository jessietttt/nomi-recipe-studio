import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, ChefHat } from 'lucide-react'
import { db } from '../lib/supabase'
import RecipeCard from '../components/RecipeCard'

const FILTER_OPTIONS = {
  status: ['All', 'Inspiration', 'To Test', 'Retest', 'Menu Ready', 'Testing'],
  course: ['All', 'Canapé', 'Otsumami', 'Crudo', 'Soup', 'Salad', 'Tartlet', 'Tempura', 'Fried', 'Grilled', 'Main', 'Side', 'Dessert', 'Petit Four'],
  cuisine: ['All', 'Japanese', 'Mexican', 'Middle Eastern', 'French', 'Italian', 'Spanish', 'Korean', 'Thai', 'Fusion'],
  type: ['All', 'Full Recipes', 'Components'],
}

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'All',
    course: 'All',
    cuisine: 'All',
    type: 'All',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const data = await db.recipes.getAll()
      setRecipes(data)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search recipes
  const filteredRecipes = recipes.filter(recipe => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableText = [
        recipe.title,
        recipe.cuisine,
        recipe.course,
        recipe.description,
        ...(recipe.dietary_tags || []),
      ].filter(Boolean).join(' ').toLowerCase()
      
      if (!searchableText.includes(query)) return false
    }

    // Status filter
    if (filters.status !== 'All') {
      const statusMap = {
        'Inspiration': 'inspiration',
        'To Test': 'to-test',
        'Retest': 'retest',
        'Testing': 'testing', // Legacy
        'Menu Ready': 'menu-ready',
      }
      if (recipe.status !== statusMap[filters.status]) return false
    }

    // Course filter - handle both string and array
    if (filters.course !== 'All') {
      const courseArray = Array.isArray(recipe.course) ? recipe.course : (recipe.course ? [recipe.course] : [])
      if (!courseArray.includes(filters.course)) return false
    }

    // Cuisine filter - handle both string and array
    if (filters.cuisine !== 'All') {
      const cuisineArray = Array.isArray(recipe.cuisine) ? recipe.cuisine : (recipe.cuisine ? [recipe.cuisine] : [])
      if (!cuisineArray.includes(filters.cuisine)) return false
    }

    // Type filter (full recipes vs components)
    if (filters.type === 'Full Recipes' && recipe.is_component) return false
    if (filters.type === 'Components' && !recipe.is_component) return false

    return true
  })

  const recipeCount = filteredRecipes.length
  const totalCount = recipes.length

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-stone-900 mb-2">
          Recipe Library
        </h1>
        <p className="text-stone-500">
          {totalCount} {totalCount === 1 ? 'recipe' : 'recipes'} in your collection
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 w-full"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-stone-900 text-stone-50' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-stone-100/50 rounded-sm animate-fade-in">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              >
                {FILTER_OPTIONS.status.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Course
              </label>
              <select
                value={filters.course}
                onChange={(e) => setFilters(f => ({ ...f, course: e.target.value }))}
              >
                {FILTER_OPTIONS.course.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Cuisine Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Cuisine
              </label>
              <select
                value={filters.cuisine}
                onChange={(e) => setFilters(f => ({ ...f, cuisine: e.target.value }))}
              >
                {FILTER_OPTIONS.cuisine.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
              >
                {FILTER_OPTIONS.type.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active filter indicator */}
        {(searchQuery || filters.status !== 'All' || filters.course !== 'All' || filters.cuisine !== 'All' || filters.type !== 'All') && (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>Showing {recipeCount} of {totalCount} recipes</span>
            <button
              onClick={() => {
                setSearchQuery('')
                setFilters({ status: 'All', course: 'All', cuisine: 'All', type: 'All' })
              }}
              className="text-orange-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Recipe Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-stone-500">Loading recipes...</div>
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        // Empty state - no recipes at all
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6">
            <ChefHat className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-medium text-stone-900 mb-3">
            Your recipe collection is empty
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Start building your culinary library by adding your first recipe.
          </p>
          <Link to="/recipes/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Recipe
          </Link>
        </div>
      ) : (
        // Empty state - no matching results
        <div className="text-center py-16">
          <p className="text-stone-500 mb-4">
            No recipes match your search or filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setFilters({ status: 'All', course: 'All', cuisine: 'All', type: 'All' })
            }}
            className="text-orange-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
