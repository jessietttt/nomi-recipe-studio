import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  X, 
  Calendar,
  Check,
  ChefHat,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Archive,
  RotateCcw,
  ArrowRightLeft
} from 'lucide-react'
import { db } from '../lib/supabase'

const STATUS_STYLES = {
  'inspiration': 'bg-amber-100 text-amber-700',
  'to-test': 'bg-blue-100 text-blue-700',
  'retest': 'bg-purple-100 text-purple-700',
  'testing': 'bg-blue-100 text-blue-700',
  'menu-ready': 'bg-green-100 text-green-700',
}

const STATUS_LABELS = {
  'inspiration': 'Inspiration',
  'to-test': 'To Test',
  'retest': 'Retest',
  'testing': 'Testing',
  'menu-ready': 'Menu Ready',
}

export default function TestingRounds() {
  const [rounds, setRounds] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRound, setEditingRound] = useState(null)
  const [expandedRounds, setExpandedRounds] = useState(new Set())
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [roundsData, recipesData] = await Promise.all([
        db.testingRounds.getAll(),
        db.recipes.getAll()
      ])
      setRounds(roundsData || [])
      setRecipes(recipesData || [])
      
      // Auto-expand active rounds
      const activeIds = (roundsData || [])
        .filter(r => r.status === 'active')
        .map(r => r.id)
      setExpandedRounds(new Set(activeIds))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (roundId) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roundId)) {
        newSet.delete(roundId)
      } else {
        newSet.add(roundId)
      }
      return newSet
    })
  }

  const handleSave = async (roundData) => {
    try {
      if (editingRound) {
        await db.testingRounds.update(editingRound.id, roundData)
      } else {
        await db.testingRounds.create(roundData)
      }
      await loadData()
      setShowAddModal(false)
      setEditingRound(null)
    } catch (error) {
      console.error('Error saving round:', error)
      alert('Failed to save testing round')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this testing round?')) return
    try {
      await db.testingRounds.delete(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting round:', error)
    }
  }

  const handleArchive = async (id) => {
    try {
      await db.testingRounds.update(id, { status: 'archived' })
      await loadData()
    } catch (error) {
      console.error('Error archiving round:', error)
    }
  }

  const handleReactivate = async (id) => {
    try {
      await db.testingRounds.update(id, { status: 'active' })
      await loadData()
    } catch (error) {
      console.error('Error reactivating round:', error)
    }
  }

  const handleToggleTested = async (roundId, recipeId, currentlyTested) => {
    try {
      await db.testingRounds.toggleRecipeTested(roundId, recipeId, !currentlyTested)
      await loadData()
    } catch (error) {
      console.error('Error toggling tested status:', error)
    }
  }

  const handleMoveRecipe = async (recipeId, fromRoundId, toRoundId) => {
    try {
      // Get both rounds
      const fromRound = rounds.find(r => r.id === fromRoundId)
      const toRound = rounds.find(r => r.id === toRoundId)
      
      if (!fromRound || !toRound) return

      // Remove from source round
      const newFromRecipeIds = (fromRound.recipe_ids || []).filter(id => id !== recipeId)
      const newFromTestedIds = (fromRound.tested_recipe_ids || []).filter(id => id !== recipeId)
      
      // Add to target round (if not already there)
      const newToRecipeIds = toRound.recipe_ids?.includes(recipeId) 
        ? toRound.recipe_ids 
        : [...(toRound.recipe_ids || []), recipeId]

      // Update both rounds
      await Promise.all([
        db.testingRounds.update(fromRoundId, { 
          recipe_ids: newFromRecipeIds,
          tested_recipe_ids: newFromTestedIds
        }),
        db.testingRounds.update(toRoundId, { 
          recipe_ids: newToRecipeIds 
        })
      ])

      await loadData()
    } catch (error) {
      console.error('Error moving recipe:', error)
    }
  }

  const handleRemoveRecipe = async (recipeId, roundId) => {
    try {
      const round = rounds.find(r => r.id === roundId)
      if (!round) return

      const newRecipeIds = (round.recipe_ids || []).filter(id => id !== recipeId)
      const newTestedIds = (round.tested_recipe_ids || []).filter(id => id !== recipeId)
      
      await db.testingRounds.update(roundId, { 
        recipe_ids: newRecipeIds,
        tested_recipe_ids: newTestedIds
      })

      await loadData()
    } catch (error) {
      console.error('Error removing recipe:', error)
    }
  }

  const formatDateRange = (start, end) => {
    if (!start && !end) return 'No dates set'
    const options = { month: 'short', day: 'numeric' }
    const startStr = start ? new Date(start).toLocaleDateString('en-AU', options) : '?'
    const endStr = end ? new Date(end).toLocaleDateString('en-AU', options) : '?'
    return `${startStr} - ${endStr}`
  }

  const getRecipeById = (id) => recipes.find(r => r.id === id)

  const activeRounds = rounds.filter(r => r.status === 'active' || r.status === 'completed')
  const archivedRounds = rounds.filter(r => r.status === 'archived')

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="animate-pulse text-stone-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium text-stone-900 mb-2">
            Testing Rounds
          </h1>
          <p className="text-stone-500">
            Organize recipe testing into focused batches
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRound(null)
            setShowAddModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Round
        </button>
      </div>

      {/* Active Rounds */}
      {activeRounds.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-sm shadow-sm">
          <ChefHat className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">No testing rounds yet</h3>
          <p className="text-stone-500 mb-4">Create a round to organize your recipe testing</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Round
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRounds.map(round => {
            const isExpanded = expandedRounds.has(round.id)
            const roundRecipes = (round.recipe_ids || []).map(getRecipeById).filter(Boolean)
            const testedIds = new Set(round.tested_recipe_ids || [])
            const testedCount = roundRecipes.filter(r => testedIds.has(r.id)).length
            
            return (
              <div key={round.id} className="bg-white rounded-sm shadow-sm overflow-hidden">
                {/* Round Header */}
                <div 
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-stone-50"
                  onClick={() => toggleExpanded(round.id)}
                >
                  <button className="text-stone-400">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-stone-900">{round.name}</h3>
                      {round.status === 'completed' && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(round.start_date, round.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChefHat className="w-4 h-4" />
                        {testedCount}/{roundRecipes.length} tested
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingRound(round)
                        setShowAddModal(true)
                      }}
                      className="p-2 text-stone-400 hover:text-stone-600"
                      title="Edit round"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(round.id)}
                      className="p-2 text-stone-400 hover:text-stone-600"
                      title="Archive round"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(round.id)}
                      className="p-2 text-stone-400 hover:text-red-600"
                      title="Delete round"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-stone-200">
                    {/* Round Notes */}
                    {round.notes && (
                      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <p className="text-sm text-amber-800">
                          <strong>Notes:</strong> {round.notes}
                        </p>
                      </div>
                    )}

                    {/* Recipe List */}
                    {roundRecipes.length === 0 ? (
                      <div className="p-4 text-center text-stone-500">
                        No recipes in this round. 
                        <button 
                          onClick={() => {
                            setEditingRound(round)
                            setShowAddModal(true)
                          }}
                          className="text-orange-600 hover:underline ml-1"
                        >
                          Add some
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {roundRecipes.map(recipe => {
                          const isTested = testedIds.has(recipe.id)
                          const otherRounds = activeRounds.filter(r => r.id !== round.id)
                          return (
                            <div 
                              key={recipe.id}
                              className={`p-4 flex items-center gap-4 ${isTested ? 'bg-green-50' : ''}`}
                            >
                              {/* Tested Checkbox */}
                              <button
                                onClick={() => handleToggleTested(round.id, recipe.id, isTested)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  isTested
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-stone-300 hover:border-green-400'
                                }`}
                              >
                                {isTested && <Check className="w-4 h-4" />}
                              </button>

                              {/* Recipe Image */}
                              {recipe.image_url && (
                                <img
                                  src={recipe.image_url}
                                  alt={recipe.title}
                                  className="w-12 h-12 object-cover rounded-sm"
                                />
                              )}

                              {/* Recipe Info */}
                              <div className="flex-1">
                                <Link
                                  to={`/recipes/${recipe.id}`}
                                  className={`font-medium hover:text-orange-600 ${isTested ? 'text-green-800' : 'text-stone-900'}`}
                                >
                                  {recipe.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[recipe.status] || STATUS_STYLES['to-test']}`}>
                                    {STATUS_LABELS[recipe.status] || recipe.status}
                                  </span>
                                </div>
                              </div>

                              {/* Move/Remove Actions */}
                              <div className="flex items-center gap-1">
                                {otherRounds.length > 0 && (
                                  <div className="relative group">
                                    <button
                                      className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded"
                                      title="Move to another round"
                                    >
                                      <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-stone-200 rounded-sm shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[180px]">
                                      <div className="py-1">
                                        <div className="px-3 py-1.5 text-xs text-stone-500 font-medium">Move to:</div>
                                        {otherRounds.map(targetRound => (
                                          <button
                                            key={targetRound.id}
                                            onClick={() => handleMoveRecipe(recipe.id, round.id, targetRound.id)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 text-stone-700"
                                          >
                                            {targetRound.name}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <button
                                  onClick={() => handleRemoveRecipe(recipe.id, round.id)}
                                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Remove from round"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Archived Rounds */}
      {archivedRounds.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-4"
          >
            {showArchived ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Archived Rounds ({archivedRounds.length})
          </button>
          
          {showArchived && (
            <div className="space-y-2 opacity-60">
              {archivedRounds.map(round => (
                <div key={round.id} className="bg-white rounded-sm shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-stone-700">{round.name}</h3>
                    <p className="text-sm text-stone-500">{formatDateRange(round.start_date, round.end_date)}</p>
                  </div>
                  <button
                    onClick={() => handleReactivate(round.id)}
                    className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <RoundModal
          round={editingRound}
          recipes={recipes}
          onClose={() => {
            setShowAddModal(false)
            setEditingRound(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// Modal Component
function RoundModal({ round, recipes, onClose, onSave }) {
  const [name, setName] = useState(round?.name || '')
  const [startDate, setStartDate] = useState(round?.start_date || '')
  const [endDate, setEndDate] = useState(round?.end_date || '')
  const [notes, setNotes] = useState(round?.notes || '')
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set(round?.recipe_ids || []))
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  // Filter recipes that are in testing states
  const testableRecipes = recipes.filter(r => 
    r.status === 'to-test' || 
    r.status === 'retest' || 
    r.status === 'testing' ||
    r.status === 'inspiration' ||
    selectedRecipeIds.has(r.id) // Always show already selected
  )

  const filteredRecipes = testableRecipes.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleRecipe = (recipeId) => {
    setSelectedRecipeIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId)
      } else {
        newSet.add(recipeId)
      }
      return newSet
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Please enter a round name')
      return
    }

    setSaving(true)
    await onSave({
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      notes: notes.trim() || null,
      recipe_ids: Array.from(selectedRecipeIds),
      status: round?.status || 'active',
      tested_recipe_ids: round?.tested_recipe_ids || [],
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-xl font-medium text-stone-900">
            {round ? 'Edit Testing Round' : 'New Testing Round'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Round Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Round Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Valentine's Menu Testing, Spring R&D Week 1"
                required
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Round Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="General notes for this testing round... e.g., focus on make-ahead components, avoid recipes needing edible flowers"
                rows={2}
              />
            </div>

            {/* Recipe Selection */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Recipes to Test ({selectedRecipeIds.size} selected)
              </label>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="mb-2"
              />

              <div className="border border-stone-200 rounded-sm max-h-64 overflow-y-auto">
                {filteredRecipes.length === 0 ? (
                  <div className="p-4 text-center text-stone-500">
                    No recipes found
                  </div>
                ) : (
                  filteredRecipes.map(recipe => (
                    <div
                      key={recipe.id}
                      onClick={() => toggleRecipe(recipe.id)}
                      className={`p-3 flex items-center gap-3 cursor-pointer border-b border-stone-100 last:border-0 hover:bg-stone-50 ${
                        selectedRecipeIds.has(recipe.id) ? 'bg-orange-50' : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedRecipeIds.has(recipe.id)
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-stone-300'
                      }`}>
                        {selectedRecipeIds.has(recipe.id) && <Check className="w-3 h-3" />}
                      </div>
                      
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt=""
                          className="w-10 h-10 object-cover rounded-sm"
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium text-stone-900">{recipe.title}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLES[recipe.status] || ''}`}>
                          {STATUS_LABELS[recipe.status] || recipe.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-stone-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : (round ? 'Save Changes' : 'Create Round')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
