import { useState, useEffect, useRef } from 'react'
import { Plus, X, Search, GripVertical } from 'lucide-react'
import { db } from '../lib/supabase'

const UNITS = [
  // Weight
  'g', 'kg', 'mg', 'oz', 'lb',
  // Volume
  'ml', 'L', 'tsp', 'tbsp', 'cup', 'fl oz',
  // Count
  'piece', 'pieces', 'whole', 'clove', 'cloves', 'slice', 'slices',
  // Other
  'bunch', 'handful', 'pinch', 'to taste', 'as needed'
]

export default function IngredientSelector({ value = [], onChange, recipeId }) {
  const [pantryIngredients, setPantryIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeRow, setActiveRow] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadPantryIngredients()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
        setActiveRow(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadPantryIngredients = async () => {
    try {
      const data = await db.ingredients.getAll()
      setPantryIngredients(data || [])
    } catch (error) {
      console.error('Error loading pantry ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const addRow = () => {
    const newRow = {
      id: `temp-${Date.now()}`,
      is_heading: false,
      ingredient_id: null,
      ingredient_name: '',
      quantity: '',
      unit: '',
      preparation: '',
      is_optional: false,
      notes: '',
      // Pantry data (populated when ingredient selected)
      supplier: null,
      cost_per_unit: null,
      cost_unit: null
    }
    onChange([...value, newRow])
  }

  const addHeading = () => {
    const newHeading = {
      id: `heading-${Date.now()}`,
      is_heading: true,
      heading_text: '',
    }
    onChange([...value, newHeading])
  }

  const updateRow = (index, field, newValue) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: newValue }
    onChange(updated)
  }

  const removeRow = (index) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const updated = [...value]
    const [draggedItem] = updated.splice(draggedIndex, 1)
    updated.splice(dropIndex, 0, draggedItem)
    onChange(updated)

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const selectIngredient = (rowIndex, ingredient) => {
    const updated = [...value]
    updated[rowIndex] = {
      ...updated[rowIndex],
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.name,
      supplier: ingredient.supplier,
      cost_per_unit: ingredient.cost_per_unit,
      cost_unit: ingredient.cost_unit
    }
    onChange(updated)
    setShowDropdown(false)
    setActiveRow(null)
    setSearchTerm('')
  }

  const createAndSelectIngredient = async (rowIndex, name) => {
    try {
      const newIngredient = await db.ingredients.create({
        name: name.trim(),
        category: 'Uncategorized'
      })
      setPantryIngredients([...pantryIngredients, newIngredient])
      selectIngredient(rowIndex, newIngredient)
    } catch (error) {
      console.error('Error creating ingredient:', error)
    }
  }

  const filteredIngredients = pantryIngredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const calculateRowCost = (row) => {
    if (!row.quantity || !row.cost_per_unit) return null
    
    const qty = parseFloat(row.quantity)
    const costPerUnit = parseFloat(row.cost_per_unit)
    const costUnit = (row.cost_unit || '').toLowerCase().trim()
    const recipeUnit = (row.unit || '').toLowerCase().trim()
    
    // Parse the cost unit to extract the denominator
    // Examples: "per kg", "per 100g", "per 20 pieces", "per piece", "per L", "per 500ml"
    
    // Try to extract number and unit from cost_unit (e.g., "per 20 pieces" -> 20, "pieces")
    const perMatch = costUnit.match(/per\s+(\d+\.?\d*)?\s*(.+)?/)
    
    if (perMatch) {
      const costQty = perMatch[1] ? parseFloat(perMatch[1]) : 1
      const costUnitType = (perMatch[2] || '').trim()
      
      // Weight conversions
      if (costUnitType === 'kg' && recipeUnit === 'g') {
        return (qty / 1000 / costQty) * costPerUnit
      }
      if (costUnitType === 'g' && recipeUnit === 'g') {
        return (qty / costQty) * costPerUnit
      }
      if (costUnitType === 'kg' && recipeUnit === 'kg') {
        return (qty / costQty) * costPerUnit
      }
      
      // Volume conversions
      if (costUnitType === 'l' && recipeUnit === 'ml') {
        return (qty / 1000 / costQty) * costPerUnit
      }
      if (costUnitType === 'ml' && recipeUnit === 'ml') {
        return (qty / costQty) * costPerUnit
      }
      if (costUnitType === 'l' && recipeUnit === 'l') {
        return (qty / costQty) * costPerUnit
      }
      
      // Piece/count conversions
      if ((costUnitType === 'piece' || costUnitType === 'pieces' || costUnitType === 'pcs') && 
          (recipeUnit === 'piece' || recipeUnit === 'pieces' || recipeUnit === 'whole')) {
        return (qty / costQty) * costPerUnit
      }
      
      // Same unit type - simple division
      if (costUnitType === recipeUnit || 
          (costUnitType.startsWith(recipeUnit)) || 
          (recipeUnit.startsWith(costUnitType))) {
        return (qty / costQty) * costPerUnit
      }
    }
    
    // Fallback: if no "per" prefix, check for simple unit matches
    if (costUnit === 'kg' && recipeUnit === 'g') {
      return (qty / 1000) * costPerUnit
    }
    if (costUnit === 'l' && recipeUnit === 'ml') {
      return (qty / 1000) * costPerUnit
    }
    
    // Last resort: assume 1:1 if units seem compatible or no cost_unit specified
    if (!costUnit || costUnit === recipeUnit) {
      return qty * costPerUnit
    }
    
    // Can't calculate - units don't match
    return null
  }

  const totalCost = value.reduce((sum, row) => {
    const rowCost = calculateRowCost(row)
    return sum + (rowCost || 0)
  }, 0)

  if (loading) {
    return <div className="text-stone-500 text-sm">Loading ingredients...</div>
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-500">
          {value.length} ingredient{value.length !== 1 ? 's' : ''}
          {totalCost > 0 && (
            <span className="ml-2 text-green-600">
              (Est. ${totalCost.toFixed(2)})
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addHeading}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
          >
            <Plus className="w-4 h-4" />
            Add Heading
          </button>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Ingredient rows */}
      {value.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-sm">
          <p className="text-stone-400 mb-2">No ingredients yet</p>
          <button
            type="button"
            onClick={addRow}
            className="text-sm text-orange-600 hover:underline"
          >
            Add your first ingredient
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((row, index) => (
            row.is_heading ? (
              // Heading row
              <div
                key={row.id || index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-2 p-2 bg-stone-100 rounded-sm border border-stone-300
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${dragOverIndex === index ? 'border-t-2 border-t-orange-400' : ''}
                `}
              >
                <div className="text-stone-400 cursor-grab active:cursor-grabbing hover:text-stone-600">
                  <GripVertical className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={row.heading_text || ''}
                  onChange={(e) => updateRow(index, 'heading_text', e.target.value)}
                  placeholder="Section heading (e.g., Shiraae sauce, For the filling...)"
                  className="flex-1 text-sm font-medium bg-transparent border-none focus:ring-0 placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              // Ingredient row
              <div
                key={row.id || index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-start gap-2 p-3 bg-stone-50 rounded-sm border border-stone-200
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${dragOverIndex === index ? 'border-t-2 border-t-orange-400' : ''}
                `}
              >
              {/* Drag handle */}
              <div className="pt-2 text-stone-400 cursor-grab active:cursor-grabbing hover:text-stone-600">
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="flex-1 grid grid-cols-12 gap-2">
                {/* Ingredient name (searchable dropdown) */}
                <div className="col-span-4 relative" ref={activeRow === index ? dropdownRef : null}>
                  <input
                    type="text"
                    value={activeRow === index ? searchTerm : (row.ingredient_name || '')}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      if (activeRow !== index) {
                        setActiveRow(index)
                        setShowDropdown(true)
                      }
                    }}
                    onFocus={() => {
                      setActiveRow(index)
                      setShowDropdown(true)
                      setSearchTerm(row.ingredient_name || '')
                    }}
                    placeholder="Search ingredient..."
                    className="w-full text-sm"
                  />
                  
                  {/* Dropdown */}
                  {showDropdown && activeRow === index && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-sm shadow-lg max-h-48 overflow-y-auto">
                      {filteredIngredients.length > 0 ? (
                        filteredIngredients.slice(0, 20).map(ing => (
                          <button
                            key={ing.id}
                            type="button"
                            onClick={() => selectIngredient(index, ing)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center justify-between"
                          >
                            <span>{ing.name}</span>
                            {ing.supplier && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                {ing.supplier}
                              </span>
                            )}
                          </button>
                        ))
                      ) : null}
                      
                      {/* Always show create option when there's search text */}
                      {searchTerm ? (
                        <button
                          type="button"
                          onClick={() => createAndSelectIngredient(index, searchTerm)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 text-orange-600 border-t border-stone-100"
                        >
                          <Plus className="w-3 h-3 inline mr-1" />
                          Create "{searchTerm}"
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-sm text-stone-400">
                          Type to search or create
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-2">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    step="0.01"
                    min="0"
                    className="w-full text-sm"
                  />
                </div>

                {/* Unit */}
                <div className="col-span-2">
                  <select
                    value={row.unit}
                    onChange={(e) => updateRow(index, 'unit', e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Unit</option>
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                {/* Preparation */}
                <div className="col-span-3">
                  <input
                    type="text"
                    value={row.preparation}
                    onChange={(e) => updateRow(index, 'preparation', e.target.value)}
                    placeholder="e.g., diced, minced"
                    className="w-full text-sm"
                  />
                </div>

                {/* Optional checkbox */}
                <div className="col-span-1 flex items-center justify-center pt-2">
                  <label className="text-xs text-stone-500 flex items-center gap-1" title="Optional ingredient">
                    <input
                      type="checkbox"
                      checked={row.is_optional}
                      onChange={(e) => updateRow(index, 'is_optional', e.target.checked)}
                      className="rounded"
                    />
                    Opt
                  </label>
                </div>
              </div>

              {/* Row info & delete */}
              <div className="flex flex-col items-end gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
                {row.supplier && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                    {row.supplier}
                  </span>
                )}
                {calculateRowCost(row) && (
                  <span className="text-[10px] text-green-600">
                    ${calculateRowCost(row).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            )
          ))}
        </div>
      )}

      {/* Add more buttons at bottom */}
      {value.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addHeading}
            className="flex-1 py-2 border-2 border-dashed border-stone-200 rounded-sm text-sm text-stone-400 hover:border-stone-400 hover:text-stone-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add heading
          </button>
          <button
            type="button"
            onClick={addRow}
            className="flex-1 py-2 border-2 border-dashed border-stone-200 rounded-sm text-sm text-stone-400 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add ingredient
          </button>
        </div>
      )}
    </div>
  )
}
