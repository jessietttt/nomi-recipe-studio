import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, X } from 'lucide-react'
import { db } from '../lib/supabase'
import RichTextEditor from '../components/RichTextEditor'
import ImageUpload from '../components/ImageUpload'
import ComponentSelector from '../components/ComponentSelector'
import ImportRecipe from '../components/ImportRecipe'
import IngredientSelector from '../components/IngredientSelector'

const INITIAL_RECIPE = {
  title: '',
  description: '',
  image_url: '',
  status: 'to-test',
  cuisine: [],
  course: [],
  dietary_tags: [],
  prep_time: '',
  cook_time: '',
  rest_time: '',
  servings: '',
  ingredients: '',
  instructions: '',
  equipment: '',
  estimated_cost: '',
  cost_notes: '',
  general_notes: '',
  source_url: '',
  video_url: '',
  extra_image_url: '',
  testing_notes: [],
  linked_components: [],
  is_component: false,
}

const STATUS_OPTIONS = [
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'to-test', label: 'To Test' },
  { value: 'retest', label: 'Retest' },
  { value: 'menu-ready', label: 'Menu Ready' },
]

// Legacy status for existing recipes
const ALL_STATUS_OPTIONS = [
  ...STATUS_OPTIONS,
  { value: 'testing', label: 'Testing (legacy)' },
]

const DEFAULT_CUISINE_OPTIONS = ['Japanese', 'Mexican', 'Middle Eastern', 'French', 'Italian', 'Spanish', 'Korean', 'Thai', 'Chinese', 'Indian', 'American', 'British', 'Fusion']
const DEFAULT_COURSE_OPTIONS = ['Canapé', 'Otsumami', 'Crudo', 'Soup', 'Salad', 'Tartlet', 'Tempura', 'Croquette', 'Fried', 'Grilled', 'Braised', 'Main', 'Side', 'Dessert', 'Petit Four', 'Drink']
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Nut-Free']

export default function RecipeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isEditing = Boolean(id)

  const [recipe, setRecipe] = useState(INITIAL_RECIPE)
  const [structuredIngredients, setStructuredIngredients] = useState([])
  const [useStructuredIngredients, setUseStructuredIngredients] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newTestNote, setNewTestNote] = useState('')
  const [newCuisineTag, setNewCuisineTag] = useState('')
  const [newCourseTag, setNewCourseTag] = useState('')

  useEffect(() => {
    if (isEditing) {
      loadRecipe()
    } else if (location.state?.fromInspiration) {
      // Pre-fill from inspiration
      const inspiration = location.state.fromInspiration
      setRecipe(prev => ({
        ...prev,
        image_url: inspiration.image_url || '',
        description: inspiration.caption || '',
        status: 'inspiration',
      }))
    }
  }, [id, location.state])

  const loadRecipe = async () => {
    try {
      const data = await db.recipes.getById(id)
      if (data) {
        setRecipe({
          ...INITIAL_RECIPE,
          ...data,
          dietary_tags: data.dietary_tags || [],
          testing_notes: data.testing_notes || [],
          linked_components: data.linked_components || [],
        })
        
        // Load structured ingredients
        try {
          const ingredientsData = await db.recipeIngredients.getByRecipeId(id)
          if (ingredientsData && ingredientsData.length > 0) {
            const formattedIngredients = ingredientsData.map(ri => {
              if (ri.is_heading) {
                return {
                  id: ri.id,
                  is_heading: true,
                  heading_text: ri.heading_text || '',
                }
              }
              return {
                id: ri.id,
                is_heading: false,
                ingredient_id: ri.ingredient_id,
                ingredient_name: ri.ingredients?.name || '',
                quantity: ri.quantity || '',
                unit: ri.unit || '',
                preparation: ri.preparation || '',
                is_optional: ri.is_optional || false,
                notes: ri.notes || '',
                supplier: ri.ingredients?.supplier || null,
                cost_per_unit: ri.ingredients?.cost_per_unit || null,
                cost_unit: ri.ingredients?.cost_unit || null
              }
            })
            setStructuredIngredients(formattedIngredients)
            setUseStructuredIngredients(true)
          }
        } catch (ingErr) {
          console.error('Error loading structured ingredients:', ingErr)
          // Non-fatal - fall back to text ingredients
        }
      } else {
        setError('Recipe not found')
      }
    } catch (err) {
      setError('Error loading recipe')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setRecipe(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleDietaryToggle = (tag) => {
    setRecipe(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }))
  }

  const handleCuisineToggle = (tag) => {
    setRecipe(prev => {
      const cuisineArray = Array.isArray(prev.cuisine) ? prev.cuisine : (prev.cuisine ? [prev.cuisine] : [])
      return {
        ...prev,
        cuisine: cuisineArray.includes(tag)
          ? cuisineArray.filter(t => t !== tag)
          : [...cuisineArray, tag]
      }
    })
  }

  const addCustomCuisine = () => {
    if (newCuisineTag.trim()) {
      const tag = newCuisineTag.trim()
      setRecipe(prev => {
        const cuisineArray = Array.isArray(prev.cuisine) ? prev.cuisine : (prev.cuisine ? [prev.cuisine] : [])
        if (!cuisineArray.includes(tag)) {
          return { ...prev, cuisine: [...cuisineArray, tag] }
        }
        return prev
      })
      setNewCuisineTag('')
    }
  }

  const handleCourseToggle = (tag) => {
    setRecipe(prev => {
      const courseArray = Array.isArray(prev.course) ? prev.course : (prev.course ? [prev.course] : [])
      return {
        ...prev,
        course: courseArray.includes(tag)
          ? courseArray.filter(t => t !== tag)
          : [...courseArray, tag]
      }
    })
  }

  const addCustomCourse = () => {
    if (newCourseTag.trim()) {
      const tag = newCourseTag.trim()
      setRecipe(prev => {
        const courseArray = Array.isArray(prev.course) ? prev.course : (prev.course ? [prev.course] : [])
        if (!courseArray.includes(tag)) {
          return { ...prev, course: [...courseArray, tag] }
        }
        return prev
      })
      setNewCourseTag('')
    }
  }

  const addTestNote = () => {
    if (newTestNote.trim()) {
      setRecipe(prev => ({
        ...prev,
        testing_notes: [
          ...prev.testing_notes,
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            note: newTestNote.trim(),
          }
        ]
      }))
      setNewTestNote('')
    }
  }

  const removeTestNote = (noteId) => {
    setRecipe(prev => ({
      ...prev,
      testing_notes: prev.testing_notes.filter(n => n.id !== noteId)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      if (!recipe.title.trim()) {
        throw new Error('Recipe title is required')
      }

      // Determine the cost to save:
      // - If manual cost is set, use that
      // - If using structured ingredients with calculated cost, use that
      // - Otherwise, null
      let costToSave = null
      if (recipe.estimated_cost !== '' && recipe.estimated_cost != null && parseFloat(recipe.estimated_cost) > 0) {
        costToSave = parseFloat(recipe.estimated_cost)
        console.log('Using manual cost:', costToSave)
      } else if (useStructuredIngredients && calculatedCost > 0) {
        costToSave = Math.round(calculatedCost * 100) / 100 // Round to 2 decimal places
        console.log('Using calculated cost:', costToSave)
      }
      console.log('Final cost to save:', costToSave)

      // Sanitize numeric fields - convert empty strings to null
      const recipeData = {
        ...recipe,
        title: recipe.title.trim(),
        description: recipe.description.trim(),
        estimated_cost: costToSave,
      }

      let savedRecipeId = id

      if (isEditing) {
        await db.recipes.update(id, recipeData)
      } else {
        const newRecipe = await db.recipes.create(recipeData)
        savedRecipeId = newRecipe.id
      }

      // Save structured ingredients if using them
      if (useStructuredIngredients && structuredIngredients.length > 0) {
        // Keep headings and ingredients that have an ingredient_id selected
        const validIngredients = structuredIngredients.filter(ing => ing.is_heading || ing.ingredient_id)
        await db.recipeIngredients.setForRecipe(savedRecipeId, validIngredients)
      }

      navigate('/')
    } catch (err) {
      setError(err.message || 'Error saving recipe')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recipe?')) return

    try {
      await db.recipes.delete(id)
      navigate('/')
    } catch (err) {
      setError('Error deleting recipe')
      console.error(err)
    }
  }

  const handleImport = (importedData) => {
    setRecipe(prev => ({
      ...prev,
      ...importedData,
      // Preserve any existing values for fields not in import
      dietary_tags: prev.dietary_tags || [],
      testing_notes: prev.testing_notes || [],
      linked_components: prev.linked_components || [],
      is_component: prev.is_component || false,
      status: prev.status || 'to-test',
    }))
  }

  // Calculate cost from structured ingredients
  const calculateIngredientCost = (ing) => {
    if (!ing.quantity || !ing.cost_per_unit) return 0
    
    const qty = parseFloat(ing.quantity)
    const costPerUnit = parseFloat(ing.cost_per_unit)
    const costUnit = (ing.cost_unit || '').toLowerCase().trim()
    const recipeUnit = (ing.unit || '').toLowerCase().trim()
    
    const perMatch = costUnit.match(/per\s+(\d+\.?\d*)?\s*(.+)?/)
    
    if (perMatch) {
      const costQty = perMatch[1] ? parseFloat(perMatch[1]) : 1
      const costUnitType = (perMatch[2] || '').trim()
      
      if (costUnitType === 'kg' && recipeUnit === 'g') return (qty / 1000 / costQty) * costPerUnit
      if (costUnitType === 'g' && recipeUnit === 'g') return (qty / costQty) * costPerUnit
      if (costUnitType === 'l' && recipeUnit === 'ml') return (qty / 1000 / costQty) * costPerUnit
      if (costUnitType === 'ml' && recipeUnit === 'ml') return (qty / costQty) * costPerUnit
      if ((costUnitType === 'piece' || costUnitType === 'pieces' || costUnitType === 'pcs') && 
          (recipeUnit === 'piece' || recipeUnit === 'pieces' || recipeUnit === 'whole')) {
        return (qty / costQty) * costPerUnit
      }
      if (costUnitType === recipeUnit || costUnitType.startsWith(recipeUnit) || recipeUnit.startsWith(costUnitType)) {
        return (qty / costQty) * costPerUnit
      }
    }
    
    if (costUnit === 'kg' && recipeUnit === 'g') return (qty / 1000) * costPerUnit
    if (costUnit === 'l' && recipeUnit === 'ml') return (qty / 1000) * costPerUnit
    if (!costUnit || costUnit === recipeUnit) return qty * costPerUnit
    
    return 0
  }

  const calculatedCost = structuredIngredients
    .filter(ing => !ing.is_heading)
    .reduce((sum, ing) => sum + calculateIngredientCost(ing), 0)

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="animate-pulse text-stone-500">Loading recipe...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
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
        {isEditing ? 'Edit Recipe' : 'Add New Recipe'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-orange-50 text-orange-700 rounded-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Import from URL - only show for new recipes */}
        {!isEditing && (
          <ImportRecipe onImport={handleImport} />
        )}

        {/* Basic Info Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Basic Information
          </h2>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-2">
              Recipe Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={recipe.title}
              onChange={handleChange}
              placeholder="e.g., Miso Butter King Salmon Crudo"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={recipe.description}
              onChange={handleChange}
              placeholder="Brief description of the dish..."
              rows={3}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Image
            </label>
            <ImageUpload
              value={recipe.image_url}
              onChange={(url) => setRecipe(prev => ({ ...prev, image_url: url }))}
            />
          </div>

          {/* Is Component Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_component"
              name="is_component"
              checked={recipe.is_component}
              onChange={handleChange}
              className="w-4 h-4 rounded border-stone-300"
            />
            <label htmlFor="is_component" className="text-sm text-stone-700">
              This is a component (can be linked to other recipes, e.g., tartlet case, salsa)
            </label>
          </div>

          {/* Source URL */}
          <div>
            <label htmlFor="source_url" className="block text-sm font-medium text-stone-700 mb-2">
              Source URL
            </label>
            <input
              type="url"
              id="source_url"
              name="source_url"
              value={recipe.source_url}
              onChange={handleChange}
              placeholder="Link to original recipe..."
            />
          </div>

          {/* Additional Media Links */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="video_url" className="block text-sm font-medium text-stone-700 mb-2">
                Video Tutorial URL
              </label>
              <input
                type="url"
                id="video_url"
                name="video_url"
                value={recipe.video_url}
                onChange={handleChange}
                placeholder="YouTube, Vimeo, etc..."
              />
            </div>
            <div>
              <label htmlFor="extra_image_url" className="block text-sm font-medium text-stone-700 mb-2">
                Extra Photo URL
              </label>
              <input
                type="url"
                id="extra_image_url"
                name="extra_image_url"
                value={recipe.extra_image_url}
                onChange={handleChange}
                placeholder="Additional reference image..."
              />
            </div>
          </div>
        </section>

        {/* Linked Components Section */}
        {!recipe.is_component && (
          <section className="space-y-4">
            <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
              Linked Components
            </h2>
            <p className="text-sm text-stone-500">
              Link component recipes that make up this dish (e.g., tartlet case, sauces, garnishes)
            </p>
            <ComponentSelector
              value={recipe.linked_components}
              onChange={(components) => setRecipe(prev => ({ ...prev, linked_components: components }))}
            />
          </section>
        )}

        {/* Classification Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-stone-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={recipe.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                {/* Show legacy 'testing' option only if recipe has that status */}
                {recipe.status === 'testing' && (
                  <option value="testing">Testing (legacy)</option>
                )}
              </select>
            </div>
          </div>

          {/* Cuisine Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Cuisine
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_CUISINE_OPTIONS.map(tag => {
                const cuisineArray = Array.isArray(recipe.cuisine) ? recipe.cuisine : (recipe.cuisine ? [recipe.cuisine] : [])
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleCuisineToggle(tag)}
                    className={`tag cursor-pointer transition-colors ${
                      cuisineArray.includes(tag)
                        ? 'bg-orange-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            {/* Show custom tags that aren't in defaults */}
            {(() => {
              const cuisineArray = Array.isArray(recipe.cuisine) ? recipe.cuisine : (recipe.cuisine ? [recipe.cuisine] : [])
              const customTags = cuisineArray.filter(t => !DEFAULT_CUISINE_OPTIONS.includes(t))
              if (customTags.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2 mb-2">
                  {customTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleCuisineToggle(tag)}
                      className="tag cursor-pointer bg-orange-500 text-white"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              )
            })()}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCuisineTag}
                onChange={(e) => setNewCuisineTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCuisine())}
                placeholder="Add custom cuisine..."
                className="flex-1 text-sm"
              />
              <button
                type="button"
                onClick={addCustomCuisine}
                className="px-3 py-1 text-sm bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Course/Style Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Course / Style
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_COURSE_OPTIONS.map(tag => {
                const courseArray = Array.isArray(recipe.course) ? recipe.course : (recipe.course ? [recipe.course] : [])
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleCourseToggle(tag)}
                    className={`tag cursor-pointer transition-colors ${
                      courseArray.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            {/* Show custom tags that aren't in defaults */}
            {(() => {
              const courseArray = Array.isArray(recipe.course) ? recipe.course : (recipe.course ? [recipe.course] : [])
              const customTags = courseArray.filter(t => !DEFAULT_COURSE_OPTIONS.includes(t))
              if (customTags.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2 mb-2">
                  {customTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleCourseToggle(tag)}
                      className="tag cursor-pointer bg-blue-500 text-white"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
              )
            })()}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCourseTag}
                onChange={(e) => setNewCourseTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCourse())}
                placeholder="Add custom course/style..."
                className="flex-1 text-sm"
              />
              <button
                type="button"
                onClick={addCustomCourse}
                className="px-3 py-1 text-sm bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Dietary Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Dietary Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleDietaryToggle(tag)}
                  className={`tag cursor-pointer transition-colors ${
                    recipe.dietary_tags.includes(tag)
                      ? 'bg-green-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Time & Servings Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Time & Servings
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="prep_time" className="block text-sm font-medium text-stone-700 mb-2">
                Prep Time
              </label>
              <input
                type="text"
                id="prep_time"
                name="prep_time"
                value={recipe.prep_time}
                onChange={handleChange}
                placeholder="e.g., 30 mins"
              />
            </div>

            <div>
              <label htmlFor="cook_time" className="block text-sm font-medium text-stone-700 mb-2">
                Cook Time
              </label>
              <input
                type="text"
                id="cook_time"
                name="cook_time"
                value={recipe.cook_time}
                onChange={handleChange}
                placeholder="e.g., 1 hour"
              />
            </div>

            <div>
              <label htmlFor="rest_time" className="block text-sm font-medium text-stone-700 mb-2">
                Rest Time
              </label>
              <input
                type="text"
                id="rest_time"
                name="rest_time"
                value={recipe.rest_time}
                onChange={handleChange}
                placeholder="e.g., overnight"
              />
            </div>

            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-stone-700 mb-2">
                Servings
              </label>
              <input
                type="text"
                id="servings"
                name="servings"
                value={recipe.servings}
                onChange={handleChange}
                placeholder="e.g., 4-6"
              />
            </div>
          </div>
        </section>

        {/* Recipe Content Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Recipe Content
          </h2>

          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <label className="text-sm font-medium text-stone-700">
                Ingredients
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer bg-stone-100 px-3 py-1.5 rounded">
                <input
                  type="checkbox"
                  checked={useStructuredIngredients}
                  onChange={(e) => setUseStructuredIngredients(e.target.checked)}
                  className="rounded"
                />
                <span className="text-stone-600">Use structured ingredients</span>
                <span className="text-xs text-stone-400">(enables costing)</span>
              </label>
            </div>
            
            {useStructuredIngredients ? (
              <IngredientSelector
                value={structuredIngredients}
                onChange={setStructuredIngredients}
                recipeId={id}
              />
            ) : (
              <RichTextEditor
                value={recipe.ingredients}
                onChange={(html) => setRecipe(prev => ({ ...prev, ingredients: html }))}
                placeholder="List ingredients..."
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Instructions
            </label>
            <RichTextEditor
              value={recipe.instructions}
              onChange={(html) => setRecipe(prev => ({ ...prev, instructions: html }))}
              placeholder="Step-by-step instructions..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Equipment
            </label>
            <RichTextEditor
              value={recipe.equipment}
              onChange={(html) => setRecipe(prev => ({ ...prev, equipment: html }))}
              placeholder="Required equipment (e.g., 20cm baking tin, siphon charger, stand mixer)..."
            />
          </div>
        </section>

        {/* Costing Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Costing
          </h2>
          <p className="text-sm text-stone-500">
            Track estimated costs for menu planning
          </p>
          
          {/* Auto-calculated cost from structured ingredients */}
          {useStructuredIngredients && calculatedCost > 0 && (
            <div className="p-4 bg-green-50 rounded-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Auto-calculated from ingredients</p>
                  <p className="text-2xl font-bold text-green-700">${calculatedCost.toFixed(2)} MXN</p>
                </div>
                {recipe.servings && (
                  <div className="text-right">
                    <p className="text-sm text-green-600">Cost per serve</p>
                    <p className="text-lg font-medium text-green-700">
                      ${(calculatedCost / parseFloat(recipe.servings)).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated_cost" className="block text-sm font-medium text-stone-700 mb-2">
                {useStructuredIngredients && calculatedCost > 0 ? 'Manual Override (MXN)' : 'Estimated Total Cost (MXN)'}
              </label>
              <input
                type="number"
                id="estimated_cost"
                name="estimated_cost"
                value={recipe.estimated_cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder={useStructuredIngredients && calculatedCost > 0 ? 'Leave blank to use auto-calculated' : 'e.g., 150'}
              />
            </div>
            
            <div>
              <label htmlFor="cost_notes" className="block text-sm font-medium text-stone-700 mb-2">
                Cost Notes
              </label>
              <input
                type="text"
                id="cost_notes"
                name="cost_notes"
                value={recipe.cost_notes}
                onChange={handleChange}
                placeholder="e.g., Lobster is seasonal, price varies"
              />
            </div>
          </div>
        </section>

        {/* General Notes Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            General Notes
          </h2>
          <p className="text-sm text-stone-500">
            Storage tips, ingredient substitutes, make-ahead notes, etc.
          </p>
          <RichTextEditor
            value={recipe.general_notes}
            onChange={(html) => setRecipe(prev => ({ ...prev, general_notes: html }))}
            placeholder="Add general notes..."
          />
        </section>

        {/* Testing Notes Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-stone-900 border-b border-stone-200 pb-2">
            Testing Notes
          </h2>

          {/* Existing notes */}
          {recipe.testing_notes.length > 0 && (
            <div className="space-y-3">
              {recipe.testing_notes.map((note, index) => (
                <div key={note.id} className="flex gap-3 p-3 bg-stone-50 rounded-sm">
                  <div className="flex-1">
                    <div className="text-xs text-stone-500 mb-1">
                      Test {index + 1} • {new Date(note.date).toLocaleDateString()}
                    </div>
                    <p className="text-sm text-stone-700">{note.note}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTestNote(note.id)}
                    className="text-stone-400 hover:text-orange-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new note */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTestNote}
              onChange={(e) => setNewTestNote(e.target.value)}
              placeholder="Add a testing note..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTestNote())}
            />
            <button
              type="button"
              onClick={addTestNote}
              className="btn-secondary px-4"
              disabled={!newTestNote.trim()}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
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
            {saving ? 'Saving...' : isEditing ? 'Update Recipe' : 'Save Recipe'}
          </button>
        </div>
      </form>
    </div>
  )
}
