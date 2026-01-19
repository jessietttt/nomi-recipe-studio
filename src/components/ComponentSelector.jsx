import { useState, useEffect } from 'react'
import { Plus, X, Link } from 'lucide-react'
import { db } from '../lib/supabase'

export default function ComponentSelector({ value = [], onChange }) {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    loadComponents()
  }, [])

  const loadComponents = async () => {
    try {
      const data = await db.recipes.getComponents()
      setComponents(data)
    } catch (err) {
      console.error('Error loading components:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (componentId) => {
    if (!value.includes(componentId)) {
      onChange([...value, componentId])
    }
    setShowSelector(false)
  }

  const handleRemove = (componentId) => {
    onChange(value.filter(id => id !== componentId))
  }

  const selectedComponents = components.filter(c => value.includes(c.id))
  const availableComponents = components.filter(c => !value.includes(c.id))

  return (
    <div className="space-y-3">
      {/* Selected components */}
      {selectedComponents.length > 0 && (
        <div className="space-y-2">
          {selectedComponents.map(component => (
            <div
              key={component.id}
              className="flex items-center gap-3 p-2 bg-stone-50 rounded-sm"
            >
              {component.image_url && (
                <img
                  src={component.image_url}
                  alt={component.title}
                  className="w-10 h-10 object-cover rounded-sm"
                />
              )}
              <span className="flex-1 text-sm text-stone-700">{component.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(component.id)}
                className="text-stone-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add component button/selector */}
      {showSelector ? (
        <div className="border border-stone-200 rounded-sm bg-white">
          <div className="p-2 border-b border-stone-200 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Select a component</span>
            <button
              type="button"
              onClick={() => setShowSelector(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-stone-500 text-sm">Loading...</div>
            ) : availableComponents.length > 0 ? (
              availableComponents.map(component => (
                <button
                  key={component.id}
                  type="button"
                  onClick={() => handleAdd(component.id)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-stone-50 transition-colors text-left"
                >
                  {component.image_url && (
                    <img
                      src={component.image_url}
                      alt={component.title}
                      className="w-8 h-8 object-cover rounded-sm"
                    />
                  )}
                  <span className="text-sm text-stone-700">{component.title}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-stone-500 text-sm">
                No components available. Create a recipe and mark it as a component first.
              </div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
        >
          <Link className="w-4 h-4" />
          Link a component recipe
        </button>
      )}
    </div>
  )
}
