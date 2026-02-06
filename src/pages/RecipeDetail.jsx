import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Clock, Users, ExternalLink, ChefHat, Printer, Timer, Calendar, Copy, Video, Image, DollarSign } from 'lucide-react'
import { db } from '../lib/supabase'

const STATUS_STYLES = {
  'inspiration': 'status-inspiration',
  'to-test': 'status-testing',
  'retest': 'status-testing',
  'testing': 'status-testing', // Legacy
  'menu-ready': 'status-menu-ready',
}

const STATUS_LABELS = {
  'inspiration': 'Inspiration',
  'to-test': 'To Test',
  'retest': 'Retest',
  'testing': 'Testing', // Legacy
  'menu-ready': 'Menu Ready',
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80',
]

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [linkedComponents, setLinkedComponents] = useState([])
  const [structuredIngredients, setStructuredIngredients] = useState([])
  const [usedInMenus, setUsedInMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecipe()
  }, [id])

  const loadRecipe = async () => {
    try {
      const data = await db.recipes.getById(id)
      if (data) {
        setRecipe(data)
        
        // Load linked components
        if (data.linked_components && data.linked_components.length > 0) {
          const components = await db.recipes.getByIds(data.linked_components)
          setLinkedComponents(components)
        }

        // Load structured ingredients
        try {
          const ingredientsData = await db.recipeIngredients.getByRecipeId(id)
          setStructuredIngredients(ingredientsData || [])
        } catch (ingErr) {
          console.error('Error loading structured ingredients:', ingErr)
        }

        // Load menus that include this recipe
        const allMenus = await db.menus.getAll()
        const menusWithRecipe = allMenus.filter(menu => 
          menu.recipes && menu.recipes.includes(id)
        )
        setUsedInMenus(menusWithRecipe)
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

  const handlePrint = () => {
    window.print()
  }

  const handleDuplicate = async () => {
    if (!recipe) return
    
    try {
      // Create a copy of the recipe without id, created_at, updated_at
      const { id: _, created_at, updated_at, ...recipeToDuplicate } = recipe
      const duplicatedRecipe = {
        ...recipeToDuplicate,
        title: `${recipe.title} (Copy)`,
        status: 'to-test', // Reset status
      }
      
      const newRecipe = await db.recipes.create(duplicatedRecipe)
      navigate(`/recipes/${newRecipe.id}/edit`)
    } catch (err) {
      console.error('Error duplicating recipe:', err)
      alert('Failed to duplicate recipe')
    }
  }

  // Calculate cost from structured ingredients
  const calculateIngredientCost = (ing) => {
    if (!ing.quantity || !ing.ingredients?.cost_per_unit) return 0
    
    const qty = parseFloat(ing.quantity)
    const costPerUnit = parseFloat(ing.ingredients.cost_per_unit)
    const costUnit = (ing.ingredients.cost_unit || '').toLowerCase().trim()
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
  
  // Use manual cost if set, otherwise use calculated
  const recipeCost = recipe?.estimated_cost ? parseFloat(recipe.estimated_cost) : calculatedCost

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse text-stone-500">Loading recipe...</div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
          <ChefHat className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-2xl font-medium text-stone-900 mb-2">
          {error || 'Recipe not found'}
        </h2>
        <Link to="/" className="text-orange-600 hover:underline">
          Back to library
        </Link>
      </div>
    )
  }

  const imageUrl = recipe.image_url || PLACEHOLDER_IMAGES[0]
  // Handle both string and array for cuisine/course
  const cuisineArray = Array.isArray(recipe.cuisine) ? recipe.cuisine : (recipe.cuisine ? [recipe.cuisine] : [])
  const courseArray = Array.isArray(recipe.course) ? recipe.course : (recipe.course ? [recipe.course] : [])
  const displayTags = [...cuisineArray, ...courseArray, ...(recipe.dietary_tags || [])].filter(Boolean)

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-area img { max-height: 200px; object-fit: cover; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in print-area">
        {/* Navigation - hidden on print */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <Link
              to={`/recipes/${id}/edit`}
              className="btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="aspect-[16/9] rounded-sm overflow-hidden mb-8 bg-stone-100">
          <img
            src={imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`status-badge ${STATUS_STYLES[recipe.status] || STATUS_STYLES.testing}`}>
              {STATUS_LABELS[recipe.status] || 'Testing'}
            </span>
            {recipe.is_component && (
              <span className="status-badge bg-purple-100 text-purple-700">
                Component
              </span>
            )}
          </div>

          <h1 className="text-4xl font-medium text-stone-900 mb-4">
            {recipe.title}
          </h1>

          {recipe.description && (
            <p className="text-lg text-stone-500 leading-relaxed mb-4">
              {recipe.description}
            </p>
          )}

          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {displayTags.map((tag, i) => (
                <span key={i} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-stone-500">
            {recipe.prep_time && (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Prep: {recipe.prep_time}
              </span>
            )}
            {recipe.cook_time && (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Cook: {recipe.cook_time}
              </span>
            )}
            {recipe.rest_time && (
              <span className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Rest: {recipe.rest_time}
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Serves: {recipe.servings}
              </span>
            )}
            {recipeCost > 0 && (
              <span className="flex items-center gap-2 text-green-600">
                <DollarSign className="w-4 h-4" />
                Est. ${recipeCost.toFixed(0)} MXN
                {recipe.servings && (
                  <span className="text-stone-400 text-sm">
                    (${(recipeCost / parseFloat(recipe.servings)).toFixed(0)}/serve)
                  </span>
                )}
              </span>
            )}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-600 hover:underline no-print"
              >
                <ExternalLink className="w-4 h-4" />
                Source
              </a>
            )}
            {recipe.video_url && (
              <a
                href={recipe.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-600 hover:underline no-print"
              >
                <Video className="w-4 h-4" />
                Video
              </a>
            )}
            {recipe.extra_image_url && (
              <a
                href={recipe.extra_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-orange-600 hover:underline no-print"
              >
                <Image className="w-4 h-4" />
                Extra Photo
              </a>
            )}
          </div>
        </div>

        {/* Linked Components */}
        {linkedComponents.length > 0 && (
          <div className="mb-8 p-4 bg-stone-50 rounded-sm">
            <h2 className="text-lg font-medium text-stone-900 mb-3">
              Components
            </h2>
            <div className="space-y-2">
              {linkedComponents.map(component => (
                <Link
                  key={component.id}
                  to={`/recipes/${component.id}`}
                  className="flex items-center gap-3 p-2 bg-white rounded-sm hover:shadow-sm transition-shadow no-print"
                >
                  {component.image_url && (
                    <img
                      src={component.image_url}
                      alt={component.title}
                      className="w-12 h-12 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-stone-700 hover:text-stone-900">{component.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recipe Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Ingredients */}
          {(recipe.ingredients || structuredIngredients.length > 0) && (
            <div className="lg:col-span-1">
              <h2 className="text-xl font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
                Ingredients
              </h2>
              {structuredIngredients.length > 0 ? (
                <ul className="space-y-2">
                  {structuredIngredients.map((ing, idx) => (
                    ing.is_heading ? (
                      <li key={ing.id || idx} className="font-medium text-stone-900 mt-4 first:mt-0">
                        {ing.heading_text}
                      </li>
                    ) : (
                      <li key={ing.id || idx} className="flex items-start gap-2 text-stone-700">
                        <span className="text-stone-400 mt-0.5">•</span>
                        <div className="flex-1">
                          <span>
                            {/* Handle "to taste" specially - show ingredient name first */}
                            {ing.unit === 'to taste' || ing.unit === 'as needed' ? (
                              <>
                                {ing.ingredients?.name || ing.ingredient_name}
                                <span className="text-stone-500">, {ing.unit}</span>
                              </>
                            ) : (
                              <>
                                {ing.quantity && <span className="font-medium">{ing.quantity}</span>}
                                {ing.unit && <span className="font-medium"> {ing.unit}</span>}
                                {(ing.quantity || ing.unit) && ' '}
                                {ing.ingredients?.name || ing.ingredient_name}
                              </>
                            )}
                            {ing.preparation && <span className="text-stone-500">, {ing.preparation}</span>}
                            {ing.is_optional && <span className="text-stone-400 text-sm"> (optional)</span>}
                          </span>
                        </div>
                      </li>
                    )
                  ))}
                </ul>
              ) : (
                <div 
                  className="text-stone-700 leading-relaxed prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: recipe.ingredients }}
                />
              )}
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions && (
            <div className="lg:col-span-2">
              <h2 className="text-xl font-medium text-stone-900 mb-4 pb-2 border-b border-stone-200">
                Instructions
              </h2>
              <div 
                className="text-stone-700 leading-relaxed prose prose-sm"
                dangerouslySetInnerHTML={{ __html: recipe.instructions }}
              />
            </div>
          )}
        </div>

        {/* Linked Component Details (expanded inline for full view) */}
        {linkedComponents.length > 0 && (
          <div className="mb-8 border-t border-stone-200 pt-8">
            <h2 className="text-2xl font-medium text-stone-900 mb-6">
              Component Recipes
            </h2>
            {linkedComponents.map(component => (
              <div key={component.id} className="mb-8 p-4 bg-stone-50 rounded-sm">
                <h3 className="text-xl font-medium text-stone-900 mb-4">
                  {component.title}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {component.ingredients && (
                    <div className="lg:col-span-1">
                      <h4 className="text-sm font-medium text-stone-700 mb-2">Ingredients</h4>
                      <div 
                        className="text-stone-600 text-sm prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: component.ingredients }}
                      />
                    </div>
                  )}
                  {component.instructions && (
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-medium text-stone-700 mb-2">Instructions</h4>
                      <div 
                        className="text-stone-600 text-sm prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: component.instructions }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Equipment */}
        {recipe.equipment && (
          <div className="mb-8 border-t border-stone-200 pt-8">
            <h2 className="text-xl font-medium text-stone-900 mb-4">
              Equipment
            </h2>
            <div 
              className="text-stone-700 leading-relaxed prose prose-sm"
              dangerouslySetInnerHTML={{ __html: recipe.equipment }}
            />
          </div>
        )}

        {/* Costing */}
        {(recipe.estimated_cost || linkedComponents.some(c => c.estimated_cost)) && (
          <div className="mb-8 border-t border-stone-200 pt-8">
            <h2 className="text-xl font-medium text-stone-900 mb-4">
              Costing
            </h2>
            <div className="bg-green-50 p-4 rounded-sm">
              {(() => {
                const baseCost = parseFloat(recipe.estimated_cost) || 0
                const componentsCost = linkedComponents.reduce((sum, c) => sum + (parseFloat(c.estimated_cost) || 0), 0)
                const totalCost = baseCost + componentsCost
                const hasComponents = linkedComponents.length > 0 && componentsCost > 0
                
                return (
                  <>
                    {/* Show breakdown if there are costed components */}
                    {hasComponents && (
                      <div className="mb-3 pb-3 border-b border-green-200">
                        <div className="flex justify-between text-sm text-green-700 mb-1">
                          <span>Base recipe</span>
                          <span>${baseCost.toFixed(2)}</span>
                        </div>
                        {linkedComponents.filter(c => c.estimated_cost).map(comp => (
                          <div key={comp.id} className="flex justify-between text-sm text-green-700 mb-1">
                            <span className="flex items-center gap-1">
                              <span className="text-[10px] px-1 py-0.5 bg-green-200 text-green-700 rounded">C</span>
                              {comp.title}
                            </span>
                            <span>${parseFloat(comp.estimated_cost).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-medium text-green-800">
                        ${totalCost.toFixed(2)}
                      </span>
                      <span className="text-green-600">
                        {hasComponents ? 'total (incl. components)' : 'total'}
                      </span>
                    </div>
                    {recipe.servings && (
                      <p className="text-green-700 mt-1">
                        ${(totalCost / parseFloat(recipe.servings)).toFixed(2)} per serve ({recipe.servings} servings)
                      </p>
                    )}
                    {recipe.cost_notes && (
                      <p className="text-sm text-green-600 mt-2">{recipe.cost_notes}</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        )}

        {/* General Notes */}
        {recipe.general_notes && (
          <div className="mb-8 border-t border-stone-200 pt-8">
            <h2 className="text-xl font-medium text-stone-900 mb-4">
              Notes
            </h2>
            <div 
              className="text-stone-700 leading-relaxed prose prose-sm bg-amber-50 p-4 rounded-sm"
              dangerouslySetInnerHTML={{ __html: recipe.general_notes }}
            />
          </div>
        )}

        {/* Used in Events/Menus */}
        {usedInMenus.length > 0 && (
          <div className="mb-8 border-t border-stone-200 pt-8 no-print">
            <h2 className="text-xl font-medium text-stone-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Used in Events
            </h2>
            <div className="space-y-2">
              {usedInMenus.map(menu => (
                <Link
                  key={menu.id}
                  to={`/menus/${menu.id}`}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-sm hover:bg-stone-100 transition-colors"
                >
                  <div>
                    <div className="font-medium text-stone-900">{menu.name}</div>
                    <div className="text-sm text-stone-500">
                      {menu.event_date && new Date(menu.event_date).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {menu.event_type && ` • ${menu.event_type}`}
                    </div>
                  </div>
                  {menu.event_date && new Date(menu.event_date) < new Date() ? (
                    <span className="text-xs font-medium px-2 py-1 bg-stone-200 text-stone-600 rounded">
                      Past
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                      Upcoming
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Testing Notes */}
        {recipe.testing_notes && recipe.testing_notes.length > 0 && (
          <div className="border-t border-stone-200 pt-8 no-print">
            <h2 className="text-xl font-medium text-stone-900 mb-4">
              Testing Notes
            </h2>
            <div className="space-y-4">
              {recipe.testing_notes.map((note, index) => (
                <div key={note.id || index} className="p-4 bg-stone-50 rounded-sm">
                  <div className="text-xs text-stone-500 mb-2">
                    Test {index + 1} • {new Date(note.date).toLocaleDateString()}
                  </div>
                  <p className="text-stone-700">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer with timestamps */}
        <div className="mt-8 pt-4 border-t border-stone-200 text-xs text-stone-500">
          {recipe.created_at && (
            <span>Added {new Date(recipe.created_at).toLocaleDateString()}</span>
          )}
          {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
            <span className="ml-4">• Updated {new Date(recipe.updated_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </>
  )
}
