import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, X, GripVertical } from 'lucide-react'
import { db } from '../lib/supabase'

const INITIAL_MENU = {
  name: '',
  event_date: '',
  event_type: '',
  guest_count: '',
  ticket_price: '',
  venue: '',
  notes: '',
  event_notes: '', // Post-event reflections
  recipes: [], // Array of recipe IDs
}

const EVENT_TYPES = ['Popup', 'Catering', 'Dinner Party', 'Cocktail Party', 'Tasting Menu', 'Other']

export default function MenuForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [menu, setMenu] = useState(INITIAL_MENU)
  const [allRecipes, setAllRecipes] = useState([])
  const [selectedRecipes, setSelectedRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showRecipeSelector, setShowRecipeSelector] = useState(false)
  
  // Drag state
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      // Load all recipes for selection
      const recipes = await db.recipes.getAll()
      setAllRecipes(recipes.filter(r => !r.is_component)) // Only full recipes, not components

      // Load menu if editing
      if (isEditing) {
        const menuData = await db.menus.getById(id)
        if (menuData) {
          setMenu(menuData)
          // Load the selected recipes
          if (menuData.recipes?.length > 0) {
            const selected = await db.recipes.getByIds(menuData.recipes)
            // Sort by the order in menu.recipes
            const sorted = menuData.recipes
              .map(rid => selected.find(r => r.id === rid))
              .filter(Boolean)
            setSelectedRecipes(sorted)
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setMenu(prev => ({ ...prev, [name]: value }))
  }

  const addRecipe = (recipe) => {
    if (!selectedRecipes.find(r => r.id === recipe.id)) {
      setSelectedRecipes(prev => [...prev, recipe])
      setMenu(prev => ({ ...prev, recipes: [...prev.recipes, recipe.id] }))
    }
    setShowRecipeSelector(false)
  }

  const removeRecipe = (recipeId) => {
    setSelectedRecipes(prev => prev.filter(r => r.id !== recipeId))
    setMenu(prev => ({ ...prev, recipes: prev.recipes.filter(id => id !== recipeId) }))
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay to show the drag visual
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newSelected = [...selectedRecipes]
    const [draggedItem] = newSelected.splice(draggedIndex, 1)
    newSelected.splice(dropIndex, 0, draggedItem)
    
    setSelectedRecipes(newSelected)
    setMenu(prev => ({ ...prev, recipes: newSelected.map(r => r.id) }))
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!menu.name.trim()) {
        throw new Error('Menu name is required')
      }

      const menuData = {
        ...menu,
        name: menu.name.trim(),
        recipes: selectedRecipes.map(r => r.id),
        // Convert empty strings to null for integer fields
        guest_count: menu.guest_count !== '' ? parseInt(menu.guest_count) || null : null,
        ticket_price: menu.ticket_price !== '' ? parseFloat(menu.ticket_price) || null : null,
      }

      if (isEditing) {
        await db.menus.update(id, menuData)
      } else {
        await db.menus.create(menuData)
      }

      navigate('/menus')
    } catch (err) {
      setError(err.message || 'Error saving menu')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this menu?')) return

    try {
      await db.menus.delete(id)
      navigate('/menus')
    } catch (err) {
      setError('Error deleting menu')
      console.error(err)
    }
  }

  const availableRecipes = allRecipes.filter(
    r => !selectedRecipes.find(sr => sr.id === r.id)
  )

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/menus')}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Menus
        </button>

        {isEditing && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-orange-600 hover:text-red-600 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>

      <h1 className="text-3xl font-medium text-stone-900 mb-8">
        {isEditing ? 'Edit Menu' : 'Create New Menu'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Details */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Event Details
          </h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
              Menu / Event Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={menu.name}
              onChange={handleChange}
              placeholder="e.g., Valentine's Tachinomi, Sakura Soiree"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="event_date" className="block text-sm font-medium text-stone-700 mb-2">
                Event Date
              </label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                value={menu.event_date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="event_type" className="block text-sm font-medium text-stone-700 mb-2">
                Event Type
              </label>
              <select
                id="event_type"
                name="event_type"
                value={menu.event_type}
                onChange={handleChange}
              >
                <option value="">Select...</option>
                {EVENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="guest_count" className="block text-sm font-medium text-stone-700 mb-2">
                Number of Guests
              </label>
              <input
                type="number"
                id="guest_count"
                name="guest_count"
                value={menu.guest_count}
                onChange={handleChange}
                placeholder="e.g., 20"
              />
            </div>

            <div>
              <label htmlFor="ticket_price" className="block text-sm font-medium text-stone-700 mb-2">
                Ticket Price (MXN)
              </label>
              <input
                type="number"
                id="ticket_price"
                name="ticket_price"
                value={menu.ticket_price}
                onChange={handleChange}
                step="0.01"
                placeholder="e.g., 850"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-stone-700 mb-2">
                Venue
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={menu.venue}
                onChange={handleChange}
                placeholder="e.g., Palomanegra"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-2">
              Planning Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={menu.notes}
              onChange={handleChange}
              placeholder="Theme, special requirements, etc."
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="event_notes" className="block text-sm font-medium text-stone-700 mb-2">
              Post-Event Notes
            </label>
            <textarea
              id="event_notes"
              name="event_notes"
              value={menu.event_notes}
              onChange={handleChange}
              placeholder="What worked well, challenges, notes for next time..."
              rows={4}
            />
            <p className="text-xs text-stone-500 mt-1">Reflections after the event - what to remember for future</p>
          </div>
        </section>

        {/* Menu Items */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Menu Items
          </h2>

          {/* Selected recipes */}
          {selectedRecipes.length > 0 ? (
            <div className="space-y-2">
              {selectedRecipes.map((recipe, index) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`
                    flex items-center gap-3 p-3 bg-stone-50 rounded-sm cursor-move
                    transition-all duration-150
                    ${dragOverIndex === index ? 'border-t-2 border-orange-400' : ''}
                    ${draggedIndex === index ? 'opacity-50' : ''}
                  `}
                >
                  <div className="text-stone-400 hover:text-stone-600 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-stone-500 bg-white rounded">
                    {index + 1}
                  </span>
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-12 h-12 object-cover rounded-sm"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-stone-900">{recipe.title}</div>
                    <div className="text-xs text-stone-500">
                      {[recipe.cuisine, recipe.course].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRecipe(recipe.id)}
                    className="text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 text-sm py-4">
              No dishes added yet. Add recipes from your library below.
            </p>
          )}

          {/* Add recipe button/selector */}
          {showRecipeSelector ? (
            <div className="border border-stone-200 rounded-sm bg-white">
              <div className="p-3 border-b border-stone-200 flex items-center justify-between">
                <span className="text-sm font-medium text-stone-700">Add a dish</span>
                <button
                  type="button"
                  onClick={() => setShowRecipeSelector(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableRecipes.length > 0 ? (
                  availableRecipes.map(recipe => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => addRecipe(recipe)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors text-left"
                    >
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.title}
                          className="w-10 h-10 object-cover rounded-sm"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-stone-900">{recipe.title}</div>
                        <div className="text-xs text-stone-500">
                          {[recipe.cuisine, recipe.course].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-stone-500 text-sm">
                    No more recipes available. Add recipes to your library first.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRecipeSelector(true)}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add dish from recipe library
            </button>
          )}
        </section>

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={() => navigate('/menus')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEditing ? 'Update Menu' : 'Create Menu'}
          </button>
        </div>
      </form>
    </div>
  )
}
