import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Calendar, Users, MapPin, Printer, ChefHat, BookOpen, ShoppingCart, Check, X } from 'lucide-react'
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

export default function MenuDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [menu, setMenu] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [linkedComponents, setLinkedComponents] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [printMode, setPrintMode] = useState('menu')
  
  // Selection state
  const [selectedRecipes, setSelectedRecipes] = useState(new Set())
  
  // Shopping list modal
  const [showShoppingList, setShowShoppingList] = useState(false)
  const [shoppingListItems, setShoppingListItems] = useState([])

  useEffect(() => {
    loadMenu()
  }, [id])

  const loadMenu = async () => {
    try {
      const menuData = await db.menus.getById(id)
      if (menuData) {
        setMenu(menuData)
        
        if (menuData.recipes?.length > 0) {
          const recipeData = await db.recipes.getByIds(menuData.recipes)
          const sorted = menuData.recipes
            .map(rid => recipeData.find(r => r.id === rid))
            .filter(Boolean)
          setRecipes(sorted)

          const allComponentIds = sorted
            .flatMap(r => r.linked_components || [])
            .filter((id, index, arr) => arr.indexOf(id) === index)
          
          if (allComponentIds.length > 0) {
            const components = await db.recipes.getByIds(allComponentIds)
            const componentMap = {}
            components.forEach(c => { componentMap[c.id] = c })
            setLinkedComponents(componentMap)
          }
        }
      } else {
        setError('Menu not found')
      }
    } catch (err) {
      setError('Error loading menu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Selection handlers
  const toggleRecipeSelection = (recipeId) => {
    const newSelection = new Set(selectedRecipes)
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId)
    } else {
      newSelection.add(recipeId)
    }
    setSelectedRecipes(newSelection)
  }

  const selectAll = () => {
    setSelectedRecipes(new Set(recipes.map(r => r.id)))
  }

  const selectNone = () => {
    setSelectedRecipes(new Set())
  }

  const handlePrintSelected = () => {
    if (selectedRecipes.size === 0) {
      selectAll()
    }
    setPrintMode('booklet')
    setTimeout(handlePrint, 100)
  }

  // Shopping list generation
  const generateShoppingList = () => {
    const recipesToUse = selectedRecipes.size > 0 
      ? recipes.filter(r => selectedRecipes.has(r.id))
      : recipes
    
    // Parse ingredients from all selected recipes
    const allIngredients = []
    
    recipesToUse.forEach(recipe => {
      const ingredients = parseIngredients(recipe.ingredients, recipe.title)
      allIngredients.push(...ingredients)
      
      // Also add component ingredients
      if (recipe.linked_components?.length > 0) {
        recipe.linked_components.forEach(compId => {
          const comp = linkedComponents[compId]
          if (comp) {
            const compIngredients = parseIngredients(comp.ingredients, comp.title)
            allIngredients.push(...compIngredients)
          }
        })
      }
    })
    
    setShoppingListItems(allIngredients)
    setShowShoppingList(true)
  }

  // Parse HTML ingredients into list
  const parseIngredients = (html, recipeName) => {
    if (!html) return []
    
    // Create a temp element to parse HTML
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    const ingredients = []
    
    // First try to get list items (li elements)
    const listItems = temp.querySelectorAll('li')
    if (listItems.length > 0) {
      listItems.forEach(li => {
        const text = (li.textContent || li.innerText).trim()
        if (text) {
          ingredients.push({
            ingredient: text,
            recipe: recipeName,
            checked: false
          })
        }
      })
      return ingredients
    }
    
    // Fallback: try paragraphs
    const paragraphs = temp.querySelectorAll('p')
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        const text = (p.textContent || p.innerText).trim()
        if (text) {
          ingredients.push({
            ingredient: text,
            recipe: recipeName,
            checked: false
          })
        }
      })
      return ingredients
    }
    
    // Last fallback: split by line breaks and bullet characters
    const text = temp.textContent || temp.innerText
    const lines = text
      .split(/[\n\r]+|•|·|‣|⁃|◦/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
    
    return lines.map(line => ({
      ingredient: line,
      recipe: recipeName,
      checked: false
    }))
  }

  // Get recipes for printing (selected or all)
  const getRecipesForPrint = () => {
    if (selectedRecipes.size === 0) return recipes
    return recipes.filter(r => selectedRecipes.has(r.id))
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse text-stone-500">Loading menu...</div>
      </div>
    )
  }

  if (error || !menu) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stone-100 mb-4">
          <Calendar className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-2xl font-medium text-stone-900 mb-2">
          {error || 'Menu not found'}
        </h2>
        <Link to="/menus" className="text-orange-600 hover:underline">
          Back to menus
        </Link>
      </div>
    )
  }

  const isPast = menu.event_date && new Date(menu.event_date) < new Date()
  const recipesForPrint = getRecipesForPrint()

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-8 print-area">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => navigate('/menus')}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menus
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setPrintMode('menu'); setTimeout(handlePrint, 100) }}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              <Printer className="w-4 h-4" />
              Print Menu
            </button>
            <button
              onClick={handlePrintSelected}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              <BookOpen className="w-4 h-4" />
              Print Recipes {selectedRecipes.size > 0 && `(${selectedRecipes.size})`}
            </button>
            <button
              onClick={generateShoppingList}
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Shopping List {selectedRecipes.size > 0 && `(${selectedRecipes.size})`}
            </button>
            <Link
              to={`/menus/${id}/edit`}
              className="btn-secondary flex items-center gap-2 text-sm py-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {menu.event_type && (
              <span className="text-xs font-medium px-2 py-1 bg-stone-100 text-stone-600 rounded">
                {menu.event_type}
              </span>
            )}
            {isPast ? (
              <span className="text-xs font-medium px-2 py-1 bg-stone-100 text-stone-500 rounded">
                Complete
              </span>
            ) : (
              <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded">
                Upcoming
              </span>
            )}
          </div>

          <h1 className="text-4xl font-medium text-stone-900 mb-4">
            {menu.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-stone-500">
            {menu.event_date && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(menu.event_date)}
              </span>
            )}
            {menu.guest_count && (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {menu.guest_count} guests
              </span>
            )}
            {menu.venue && (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {menu.venue}
              </span>
            )}
          </div>

          {menu.notes && (
            <p className="mt-4 text-stone-600 bg-stone-50 p-4 rounded-sm">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide block mb-1">Planning Notes</span>
              {menu.notes}
            </p>
          )}

          {menu.event_notes && (
            <div className="mt-4 bg-amber-50 p-4 rounded-sm">
              <span className="text-xs font-medium text-amber-700 uppercase tracking-wide block mb-1">Post-Event Reflections</span>
              <p className="text-stone-700 whitespace-pre-wrap">{menu.event_notes}</p>
            </div>
          )}
        </div>

        {/* Cost Summary */}
        {recipes.length > 0 && (
          <div className="mb-8 p-4 bg-green-50 rounded-sm no-print">
            <h3 className="text-sm font-medium text-green-800 mb-3">Cost Summary</h3>
            {(() => {
              // Calculate total cost including components (avoiding double-counting)
              // Components that are linked to recipes on the menu are counted via their parent
              const componentIdsOnMenu = new Set(recipes.map(r => r.id))
              
              let totalCost = 0
              let recipesWithCost = 0
              
              recipes.forEach(r => {
                // Add recipe's own cost
                const baseCost = parseFloat(r.estimated_cost) || 0
                
                // Add component costs (only if component isn't also directly on menu)
                let componentCost = 0
                if (r.linked_components?.length > 0) {
                  r.linked_components.forEach(compId => {
                    if (!componentIdsOnMenu.has(compId)) {
                      const comp = linkedComponents[compId]
                      if (comp?.estimated_cost) {
                        componentCost += parseFloat(comp.estimated_cost) || 0
                      }
                    }
                  })
                }
                
                const recipeTotalCost = baseCost + componentCost
                if (recipeTotalCost > 0) {
                  totalCost += recipeTotalCost
                  recipesWithCost++
                }
              })
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-medium text-green-800">
                      ${totalCost.toFixed(0)}
                    </div>
                    <div className="text-xs text-green-600">Total Food Cost</div>
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-green-800">
                      {recipesWithCost}/{recipes.length}
                    </div>
                    <div className="text-xs text-green-600">Recipes Costed</div>
                  </div>
                  {menu.guest_count && totalCost > 0 && (
                    <div>
                      <div className="text-2xl font-medium text-green-800">
                        ${(totalCost / menu.guest_count).toFixed(0)}
                      </div>
                      <div className="text-xs text-green-600">Cost per Guest</div>
                    </div>
                  )}
                  {menu.ticket_price && menu.guest_count && totalCost > 0 && (
                    <div>
                      <div className="text-2xl font-medium text-green-800">
                        {((totalCost / (menu.ticket_price * menu.guest_count)) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-600">Food Cost %</div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Menu Items */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium text-stone-900 flex items-center gap-2">
              <ChefHat className="w-6 h-6" />
              Menu
            </h2>
            
            {/* Selection controls */}
            {recipes.length > 0 && (
              <div className="flex items-center gap-3 no-print">
                <span className="text-sm text-stone-500">
                  {selectedRecipes.size > 0 ? `${selectedRecipes.size} selected` : 'Select recipes for print/shopping'}
                </span>
                <button
                  onClick={selectAll}
                  className="text-xs text-orange-600 hover:underline"
                >
                  Select All
                </button>
                {selectedRecipes.size > 0 && (
                  <button
                    onClick={selectNone}
                    className="text-xs text-stone-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {recipes.length > 0 ? (
            <div className="space-y-4">
              {recipes.map((recipe, index) => (
                <div
                  key={recipe.id}
                  className={`flex items-start gap-4 p-4 bg-white rounded-sm shadow-sm transition-all ${
                    selectedRecipes.has(recipe.id) ? 'ring-2 ring-orange-400' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="no-print">
                    <button
                      onClick={() => toggleRecipeSelection(recipe.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedRecipes.has(recipe.id)
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-stone-300 hover:border-orange-400'
                      }`}
                    >
                      {selectedRecipes.has(recipe.id) && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <span className="w-8 h-8 flex items-center justify-center text-sm font-medium text-stone-500 bg-stone-100 rounded-full">
                    {index + 1}
                  </span>
                  {recipe.image_url && (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-20 h-20 object-cover rounded-sm"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/recipes/${recipe.id}`}
                            className="text-xl font-medium text-stone-900 hover:text-orange-600 transition-colors no-print"
                          >
                            {recipe.title}
                          </Link>
                          <span className="text-xl font-medium text-stone-900 hidden print:inline">
                            {recipe.title}
                          </span>
                          {recipe.status && recipe.status !== 'menu-ready' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full no-print ${STATUS_STYLES[recipe.status] || STATUS_STYLES['to-test']}`}>
                              {STATUS_LABELS[recipe.status] || recipe.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                          {(() => {
                            const cuisineArr = Array.isArray(recipe.cuisine) ? recipe.cuisine : (recipe.cuisine ? [recipe.cuisine] : [])
                            const courseArr = Array.isArray(recipe.course) ? recipe.course : (recipe.course ? [recipe.course] : [])
                            return (
                              <>
                                {cuisineArr.length > 0 && <span>{cuisineArr.join(', ')}</span>}
                                {courseArr.length > 0 && <span>• {courseArr.join(', ')}</span>}
                              </>
                            )
                          })()}
                          {recipe.dietary_tags?.length > 0 && (
                            <span>• {recipe.dietary_tags.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      {recipe.estimated_cost && (
                        <span className="text-sm font-medium text-green-600 no-print">
                          ${parseFloat(recipe.estimated_cost).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-500 py-8 text-center">
              No dishes added to this menu yet.
            </p>
          )}
        </section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-stone-200 text-xs text-stone-500 no-print">
          {menu.created_at && (
            <span>Created {new Date(menu.created_at).toLocaleDateString()}</span>
          )}
        </div>

        {/* Recipe Booklet - only shows when printing in booklet mode */}
        {printMode === 'booklet' && (
          <div className="hidden print:block">
            <div className="page-break-before pt-8">
              <h1 className="text-3xl font-medium text-stone-900 text-center mb-2">
                {menu.name}
              </h1>
              <p className="text-center text-stone-500 mb-8">
                {formatDate(menu.event_date)}
                {menu.guest_count && ` • ${menu.guest_count} guests`}
              </p>
              <h2 className="text-xl font-medium text-stone-900 mb-4">Recipe Collection</h2>
            </div>

            {recipesForPrint.map((recipe, index) => (
              <div key={recipe.id} className="page-break-before pt-8 mb-8">
                <div className="border-b-2 border-stone-200 pb-4 mb-6">
                  <span className="text-sm text-stone-500">Recipe {index + 1} of {recipesForPrint.length}</span>
                  <h2 className="text-2xl font-medium text-stone-900 mt-1">
                    {recipe.title}
                  </h2>
                  {recipe.description && (
                    <p className="text-stone-600 mt-2">{recipe.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-stone-500">
                    {recipe.prep_time && <span>Prep: {recipe.prep_time}</span>}
                    {recipe.cook_time && <span>Cook: {recipe.cook_time}</span>}
                    {recipe.rest_time && <span>Rest: {recipe.rest_time}</span>}
                    {recipe.servings && <span>Serves: {recipe.servings}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <h3 className="font-medium text-stone-900 mb-2">Ingredients</h3>
                    <div 
                      className="text-sm text-stone-700 prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: recipe.ingredients || '<p>No ingredients listed</p>' }}
                    />
                  </div>
                  <div className="col-span-2">
                    <h3 className="font-medium text-stone-900 mb-2">Instructions</h3>
                    <div 
                      className="text-sm text-stone-700 prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: recipe.instructions || '<p>No instructions listed</p>' }}
                    />
                  </div>
                </div>

                {recipe.linked_components?.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-stone-200">
                    <h3 className="font-medium text-stone-900 mb-4">Components</h3>
                    {recipe.linked_components.map(compId => {
                      const comp = linkedComponents[compId]
                      if (!comp) return null
                      return (
                        <div key={comp.id} className="mb-4 p-4 bg-stone-50 rounded-sm">
                          <h4 className="font-medium text-stone-800 mb-2">{comp.title}</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                              <div 
                                className="text-xs text-stone-600 prose prose-sm"
                                dangerouslySetInnerHTML={{ __html: comp.ingredients || '' }}
                              />
                            </div>
                            <div className="col-span-2">
                              <div 
                                className="text-xs text-stone-600 prose prose-sm"
                                dangerouslySetInnerHTML={{ __html: comp.instructions || '' }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {recipe.general_notes && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-sm">
                    <h4 className="font-medium text-stone-800 text-sm mb-1">Notes</h4>
                    <div 
                      className="text-xs text-stone-600 prose prose-sm"
                      dangerouslySetInnerHTML={{ __html: recipe.general_notes }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shopping List Modal */}
      {showShoppingList && (
        <ShoppingListModal
          items={shoppingListItems}
          menuName={menu.name}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </>
  )
}

// Shopping List Modal Component
function ShoppingListModal({ items, menuName, onClose }) {
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [groupByRecipe, setGroupByRecipe] = useState(false)

  const toggleItem = (index) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedItems(newChecked)
  }

  const handlePrint = () => {
    window.print()
  }

  // Group items by recipe or flatten
  const groupedItems = groupByRecipe
    ? items.reduce((acc, item, index) => {
        if (!acc[item.recipe]) acc[item.recipe] = []
        acc[item.recipe].push({ ...item, index })
        return acc
      }, {})
    : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-medium text-stone-900">Shopping List</h2>
            <p className="text-sm text-stone-500">{menuName} • {items.length} items</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-stone-200 no-print">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={groupByRecipe}
              onChange={(e) => setGroupByRecipe(e.target.checked)}
              className="rounded"
            />
            Group by recipe
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 shopping-list-print">
          <h3 className="hidden print:block text-xl font-medium mb-4">Shopping List: {menuName}</h3>

          {groupByRecipe && groupedItems ? (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([recipeName, recipeItems]) => (
                <div key={recipeName}>
                  <h3 className="font-medium text-stone-900 mb-2 pb-1 border-b border-stone-200">
                    {recipeName}
                  </h3>
                  <div className="space-y-1">
                    {recipeItems.map((item) => (
                      <label
                        key={item.index}
                        className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checkedItems.has(item.index)}
                          onChange={() => toggleItem(item.index)}
                          className="rounded no-print"
                        />
                        <span className="hidden print:inline-block w-4 h-4 border border-stone-300 rounded-sm mr-2" />
                        <span className={checkedItems.has(item.index) ? 'line-through text-stone-400' : ''}>
                          {item.ingredient}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <label
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems.has(index)}
                    onChange={() => toggleItem(index)}
                    className="rounded no-print"
                  />
                  <span className="hidden print:inline-block w-4 h-4 border border-stone-300 rounded-sm mr-2" />
                  <span className={`flex-1 ${checkedItems.has(index) ? 'line-through text-stone-400' : ''}`}>
                    {item.ingredient}
                  </span>
                  <span className="text-xs text-stone-400 no-print">{item.recipe}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-stone-200 text-sm text-stone-500 no-print">
          Tip: Check items off as you shop. Use "Group by recipe" to organize by dish.
        </div>
      </div>
    </div>
  )
}
