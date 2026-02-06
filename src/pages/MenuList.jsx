import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, ChefHat, Users, DollarSign } from 'lucide-react'
import { db } from '../lib/supabase'

export default function MenuList() {
  const [menus, setMenus] = useState([])
  const [allRecipes, setAllRecipes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMenus()
  }, [])

  const loadMenus = async () => {
    try {
      const data = await db.menus.getAll()
      setMenus(data)
      
      // Load all recipes referenced by menus
      const allRecipeIds = [...new Set(data.flatMap(m => m.recipes || []))]
      if (allRecipeIds.length > 0) {
        const recipes = await db.recipes.getByIds(allRecipeIds)
        const recipeMap = {}
        recipes.forEach(r => { recipeMap[r.id] = r })
        setAllRecipes(recipeMap)
      }
    } catch (error) {
      console.error('Error loading menus:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate total cost for a menu
  const getMenuCost = (menu) => {
    if (!menu.recipes?.length) return 0
    return menu.recipes.reduce((sum, recipeId) => {
      const recipe = allRecipes[recipeId]
      return sum + (parseFloat(recipe?.estimated_cost) || 0)
    }, 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const upcomingMenus = menus
    .filter(m => new Date(m.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date)) // Soonest first
  
  const pastMenus = menus
    .filter(m => new Date(m.event_date) < new Date())
    .sort((a, b) => new Date(b.event_date) - new Date(a.event_date)) // Most recent first

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium text-stone-900 mb-2">
            Menu Planning
          </h1>
          <p className="text-stone-500">
            Plan menus for your events and popups
          </p>
        </div>
        <Link
          to="/menus/new"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Menu
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-stone-500">Loading menus...</div>
        </div>
      ) : menus.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6">
            <Calendar className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-medium text-stone-900 mb-3">
            No menus yet
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Create a menu to start planning your next event or popup.
          </p>
          <Link to="/menus/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {upcomingMenus.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-stone-900 mb-4">Upcoming Events</h2>
              <div className="grid gap-4">
                {upcomingMenus.map(menu => {
                  const menuCost = getMenuCost(menu)
                  return (
                    <Link
                      key={menu.id}
                      to={`/menus/${menu.id}`}
                      className="block p-4 bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-medium text-stone-900 mb-1">
                            {menu.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(menu.event_date)}
                            </span>
                            {menu.guest_count && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {menu.guest_count} guests
                              </span>
                            )}
                            {menu.recipes?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ChefHat className="w-4 h-4" />
                                {menu.recipes.length} dishes
                              </span>
                            )}
                            {menuCost > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <DollarSign className="w-4 h-4" />
                                Est. ${menuCost.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                          Upcoming
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastMenus.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-stone-900 mb-4">Past Events</h2>
              <div className="grid gap-4">
                {pastMenus.map(menu => {
                  const menuCost = getMenuCost(menu)
                  return (
                    <Link
                      key={menu.id}
                      to={`/menus/${menu.id}`}
                      className="block p-4 bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-medium text-stone-900 mb-1">
                            {menu.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(menu.event_date)}
                            </span>
                            {menu.guest_count && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {menu.guest_count} guests
                              </span>
                            )}
                            {menu.recipes?.length > 0 && (
                              <span className="flex items-center gap-1">
                                <ChefHat className="w-4 h-4" />
                                {menu.recipes.length} dishes
                              </span>
                            )}
                            {menuCost > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <DollarSign className="w-4 h-4" />
                                Est. ${menuCost.toFixed(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-stone-100 text-stone-600 rounded">
                          Complete
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
