import { useState, useEffect } from 'react'
import { Plus, Search, Upload, Edit2, Trash2, X, Package, AlertCircle } from 'lucide-react'
import { db } from '../lib/supabase'

const CATEGORIES = [
  'Pantry',
  'Produce',
  'Protein',
  'Dairy',
  'Spice',
  'Condiment',
  'Sauce',
  'Noodles & Pasta',
  'Rice & Grains',
  'Baking',
  'Tea',
  'Decoration',
  'Other'
]

const SUPPLIERS = [
  'Toyo',
  'Tapias',
  'Market',
  'Supermarket',
  'Online',
  'Other'
]

const FORMS = [
  'Whole',
  'Powder',
  'Liquid',
  'Flakes',
  'Paste',
  'Dried',
  'Fresh',
  'Frozen',
  'Other'
]

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSupplier, setFilterSupplier] = useState('')
  const [showExpiringSoon, setShowExpiringSoon] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showImportModal, setShowImportModal] = useState(false)

  useEffect(() => {
    loadIngredients()
  }, [])

  const loadIngredients = async () => {
    try {
      const data = await db.ingredients.getAll()
      setIngredients(data || [])
    } catch (error) {
      console.error('Error loading ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (ingredient) => {
    try {
      if (editingItem) {
        await db.ingredients.update(editingItem.id, ingredient)
      } else {
        await db.ingredients.create(ingredient)
      }
      await loadIngredients()
      setShowAddModal(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving ingredient:', error)
      alert('Failed to save ingredient')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this ingredient?')) return
    try {
      await db.ingredients.delete(id)
      await loadIngredients()
    } catch (error) {
      console.error('Error deleting ingredient:', error)
    }
  }

  const handleImport = async (importedIngredients) => {
    try {
      // Clean up the data before import
      const cleanedIngredients = importedIngredients.map(item => ({
        name: item.name || 'Unknown',
        category: item.category || null,
        subcategory: item.subcategory || null,
        form: item.form || null,
        default_unit: item.default_unit || null,
        quantity_on_hand: item.quantity_on_hand || 0,
        unit_on_hand: item.unit_on_hand || null,
        expiry_date: item.expiry_date || null,
        cost_per_unit: item.cost_per_unit || null,
        cost_unit: item.cost_unit || null,
        supplier: item.supplier || null,
        origin_country: item.origin_country || null,
        dietary_info: item.dietary_info || null,
        storage_notes: item.storage_notes || null,
        primary_uses: item.primary_uses || null,
        recipe_ideas: item.recipe_ideas || null,
        notes: item.notes || null,
      }))
      
      await db.ingredients.createMany(cleanedIngredients)
      await loadIngredients()
      setShowImportModal(false)
    } catch (error) {
      console.error('Error importing ingredients:', error)
      alert('Failed to import ingredients')
    }
  }

  // Filter ingredients
  const filteredIngredients = ingredients.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!item.name?.toLowerCase().includes(query)) return false
    }
    if (filterCategory && item.category !== filterCategory) return false
    if (filterSupplier && item.supplier !== filterSupplier) return false
    if (showExpiringSoon) {
      if (!item.expiry_date) return false
      const expiryDate = new Date(item.expiry_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      if (expiryDate > thirtyDaysFromNow) return false
    }
    return true
  })

  // Group by category
  const groupedIngredients = filteredIngredients.reduce((acc, item) => {
    const category = item.category || 'Uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false
    const expiryDate = new Date(dateStr)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow
  }

  const isExpired = (dateStr) => {
    if (!dateStr) return false
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium text-stone-900 mb-2">
            Ingredients
          </h1>
          <p className="text-stone-500">
            {ingredients.length} ingredients in your pantry
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="min-w-[150px]"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="min-w-[150px]"
        >
          <option value="">All Suppliers</option>
          {SUPPLIERS.map(sup => (
            <option key={sup} value={sup}>{sup}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showExpiringSoon}
            onChange={(e) => setShowExpiringSoon(e.target.checked)}
            className="rounded"
          />
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-sm">Expiring Soon</span>
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-stone-500">Loading ingredients...</div>
        </div>
      ) : ingredients.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6">
            <Package className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-medium text-stone-900 mb-3">
            No ingredients yet
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Add ingredients manually or import from a CSV file.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Ingredient
            </button>
          </div>
        </div>
      ) : filteredIngredients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-500">No ingredients match your filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedIngredients).sort().map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg font-medium text-stone-900 mb-3 pb-2 border-b border-stone-200">
                {category} <span className="text-stone-400 font-normal">({items.length})</span>
              </h2>
              <div className="grid gap-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow ${
                      isExpired(item.expiry_date) ? 'border-l-4 border-red-400' :
                      isExpiringSoon(item.expiry_date) ? 'border-l-4 border-amber-400' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-stone-900">{item.name}</h3>
                        {item.form && (
                          <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                            {item.form}
                          </span>
                        )}
                        {item.origin_country && (
                          <span className="text-xs text-stone-500">
                            ({item.origin_country})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                        {item.quantity_on_hand > 0 && (
                          <span>
                            {item.quantity_on_hand}{item.unit_on_hand || item.default_unit || 'g'} on hand
                          </span>
                        )}
                        {item.supplier && (
                          <span>from {item.supplier}</span>
                        )}
                        {item.expiry_date && (
                          <span className={isExpired(item.expiry_date) ? 'text-red-600' : isExpiringSoon(item.expiry_date) ? 'text-amber-600' : ''}>
                            {isExpired(item.expiry_date) ? 'Expired' : 'Exp'}: {new Date(item.expiry_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {item.cost_per_unit && (
                          <span>${item.cost_per_unit}/{item.cost_unit || 'unit'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item)
                          setShowAddModal(true)
                        }}
                        className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <IngredientModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}

// Add/Edit Modal
function IngredientModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || '',
    subcategory: item?.subcategory || '',
    form: item?.form || '',
    default_unit: item?.default_unit || 'g',
    quantity_on_hand: item?.quantity_on_hand || '',
    unit_on_hand: item?.unit_on_hand || '',
    expiry_date: item?.expiry_date || '',
    cost_per_unit: item?.cost_per_unit || '',
    cost_unit: item?.cost_unit || '',
    supplier: item?.supplier || '',
    origin_country: item?.origin_country || '',
    storage_notes: item?.storage_notes || '',
    notes: item?.notes || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSave({
      ...formData,
      quantity_on_hand: formData.quantity_on_hand ? parseFloat(formData.quantity_on_hand) : 0,
      cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
      expiry_date: formData.expiry_date || null,
      category: formData.category || null,
      subcategory: formData.subcategory || null,
      form: formData.form || null,
      unit_on_hand: formData.unit_on_hand || null,
      cost_unit: formData.cost_unit || null,
      supplier: formData.supplier || null,
      origin_country: formData.origin_country || null,
      storage_notes: formData.storage_notes || null,
      notes: formData.notes || null,
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div 
          className="bg-white rounded-sm max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-stone-200">
            <h2 className="text-xl font-medium text-stone-900">
              {item ? 'Edit Ingredient' : 'Add Ingredient'}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Category & Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Form
              </label>
              <select
                value={formData.form}
                onChange={(e) => setFormData({ ...formData, form: e.target.value })}
              >
                <option value="">Select...</option>
                {FORMS.map(form => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Quantity on Hand
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity_on_hand}
                onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit_on_hand}
                onChange={(e) => setFormData({ ...formData, unit_on_hand: e.target.value })}
                placeholder="g, ml, pcs..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Cost per Unit
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                placeholder="e.g., 150"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Cost Unit
              </label>
              <input
                type="text"
                value={formData.cost_unit}
                onChange={(e) => setFormData({ ...formData, cost_unit: e.target.value })}
                placeholder="per 100g, per kg..."
              />
            </div>
          </div>

          {/* Supplier & Origin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              >
                <option value="">Select...</option>
                {SUPPLIERS.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Origin Country
              </label>
              <input
                type="text"
                value={formData.origin_country}
                onChange={(e) => setFormData({ ...formData, origin_country: e.target.value })}
                placeholder="Japan, Australia..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Storage Notes
            </label>
            <input
              type="text"
              value={formData.storage_notes}
              onChange={(e) => setFormData({ ...formData, storage_notes: e.target.value })}
              placeholder="Keep refrigerated, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {item ? 'Save Changes' : 'Add Ingredient'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

// Import CSV Modal
function ImportModal({ onClose, onImport }) {
  const [csvData, setCsvData] = useState('')
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      setError('CSV must have a header row and at least one data row')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const ingredients = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      if (values.length < 1 || !values[0]) continue

      const item = {}
      
      // Map CSV columns to our schema
      headers.forEach((header, index) => {
        const value = values[index] || ''
        
        if (header.includes('ingredient') || header === 'name') {
          item.name = value
        } else if (header === 'country' || header.includes('origin')) {
          item.origin_country = value
        } else if (header === 'form') {
          item.form = value
        } else if (header.includes('quantity')) {
          const match = value.match(/(\d+\.?\d*)/)
          if (match) item.quantity_on_hand = parseFloat(match[1])
          const unit = value.replace(/[\d.]/g, '').trim()
          if (unit) item.unit_on_hand = unit
        } else if (header === 'amount') {
          item.amount = value
        } else if (header.includes('expir') || header.includes('best before')) {
          // Parse date in format MM/YYYY or MM/YY
          if (value) {
            const parts = value.split('/')
            if (parts.length === 2) {
              const month = parseInt(parts[0])
              let year = parseInt(parts[1])
              if (year < 100) year += 2000
              item.expiry_date = `${year}-${month.toString().padStart(2, '0')}-01`
            }
          }
        } else if (header === 'dietary') {
          item.dietary_info = value ? [value] : []
        } else if (header === 'category') {
          item.category = value
        } else if (header.includes('recipe')) {
          item.recipe_ideas = value
        } else if (header.includes('use')) {
          item.primary_uses = value
        } else if (header.includes('purchase') || header.includes('origin')) {
          if (!item.supplier && value) {
            // Try to extract supplier from text
            if (value.toLowerCase().includes('toyo')) item.supplier = 'Toyo'
          }
        } else if (header === 'notes') {
          item.notes = value
        } else if (header.includes('storage')) {
          item.storage_notes = value
        }
      })

      if (item.name) {
        // Set defaults
        if (!item.category) item.category = 'Pantry'
        ingredients.push(item)
      }
    }

    setPreview(ingredients)
    setError('')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvData(event.target.result)
      parseCSV(event.target.result)
    }
    reader.readAsText(file)
  }

  const handleTextChange = (e) => {
    setCsvData(e.target.value)
    if (e.target.value.trim()) {
      parseCSV(e.target.value)
    } else {
      setPreview([])
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div 
          className="bg-white rounded-sm max-w-3xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-stone-200">
            <h2 className="text-xl font-medium text-stone-900">Import Ingredients from CSV</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-stone-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-medium
                file:bg-stone-100 file:text-stone-700
                hover:file:bg-stone-200"
            />
          </div>

          <div className="text-center text-stone-400 text-sm">or paste CSV data</div>

          {/* Text input */}
          <div>
            <textarea
              value={csvData}
              onChange={handleTextChange}
              placeholder="Paste CSV content here..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-2">
                Preview ({preview.length} ingredients)
              </h3>
              <div className="max-h-64 overflow-y-auto border border-stone-200 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Form</th>
                      <th className="text-left p-2">Qty</th>
                      <th className="text-left p-2">Origin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((item, i) => (
                      <tr key={i} className="border-t border-stone-100">
                        <td className="p-2">{item.name}</td>
                        <td className="p-2">{item.category}</td>
                        <td className="p-2">{item.form}</td>
                        <td className="p-2">{item.quantity_on_hand}{item.unit_on_hand}</td>
                        <td className="p-2">{item.origin_country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <div className="p-2 text-center text-stone-500 text-sm">
                    ...and {preview.length - 20} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={() => onImport(preview)}
              disabled={preview.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {preview.length} Ingredients
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
