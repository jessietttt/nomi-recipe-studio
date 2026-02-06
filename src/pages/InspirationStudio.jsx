import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Upload, Link, Edit2, Trash2, Tag, ExternalLink, ChefHat } from 'lucide-react'
import { db, uploadImage } from '../lib/supabase'

export default function InspirationStudio() {
  const navigate = useNavigate()
  const [inspirations, setInspirations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [viewingItem, setViewingItem] = useState(null)

  useEffect(() => {
    loadInspirations()
  }, [])

  const loadInspirations = async () => {
    try {
      const data = await db.inspirations.getAll()
      setInspirations(data)
    } catch (error) {
      console.error('Error loading inspirations:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get all unique tags
  const allTags = [...new Set(inspirations.flatMap(i => i.tags || []))].sort()

  // Filter inspirations
  const filteredInspirations = inspirations.filter(item => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesCaption = item.caption?.toLowerCase().includes(query)
      const matchesTags = item.tags?.some(t => t.toLowerCase().includes(query))
      if (!matchesCaption && !matchesTags) return false
    }

    // Tag filter
    if (selectedTags.length > 0) {
      if (!selectedTags.every(tag => item.tags?.includes(tag))) return false
    }

    return true
  })

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this inspiration?')) return
    try {
      await db.inspirations.delete(id)
      setInspirations(prev => prev.filter(i => i.id !== id))
      setViewingItem(null)
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium text-stone-900 mb-2">
            Inspiration Studio
          </h1>
          <p className="text-stone-500">
            {inspirations.length} images in your collection
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Inspiration
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search captions and tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`tag cursor-pointer transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-sm text-orange-600 hover:underline ml-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Masonry Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-stone-500">Loading inspirations...</div>
        </div>
      ) : filteredInspirations.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-6">
            <Upload className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-2xl font-medium text-stone-900 mb-3">
            {searchQuery || selectedTags.length > 0 ? 'No matches found' : 'Start collecting inspiration'}
          </h2>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            {searchQuery || selectedTags.length > 0 
              ? 'Try different search terms or clear filters'
              : 'Add food photos, screenshots, and visual ideas for your menus'
            }
          </p>
          {!searchQuery && selectedTags.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Inspiration
            </button>
          )}
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredInspirations.map(item => (
            <div
              key={item.id}
              className="break-inside-avoid cursor-pointer group"
              onClick={() => setViewingItem(item)}
            >
              <div className="relative bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={item.image_url}
                  alt={item.caption || 'Inspiration'}
                  className="w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    {item.caption && (
                      <p className="text-white text-sm line-clamp-2 mb-1">
                        {item.caption}
                      </p>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-white/70">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <AddEditModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false)
            setEditingItem(null)
          }}
          onSave={async (data) => {
            try {
              if (editingItem) {
                const updated = await db.inspirations.update(editingItem.id, data)
                setInspirations(prev => prev.map(i => i.id === editingItem.id ? updated : i))
              } else {
                const created = await db.inspirations.create(data)
                setInspirations(prev => [created, ...prev])
              }
              setShowAddModal(false)
              setEditingItem(null)
            } catch (error) {
              console.error('Error saving:', error)
              alert('Error saving inspiration')
            }
          }}
        />
      )}

      {/* View Modal */}
      {viewingItem && (
        <ViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={() => {
            setEditingItem(viewingItem)
            setViewingItem(null)
          }}
          onDelete={() => handleDelete(viewingItem.id)}
          onCreateRecipe={() => {
            navigate('/recipes/new', { 
              state: { 
                fromInspiration: {
                  image_url: viewingItem.image_url,
                  caption: viewingItem.caption,
                  tags: viewingItem.tags,
                }
              }
            })
          }}
        />
      )}
    </div>
  )
}

// Add/Edit Modal Component
function AddEditModal({ item, onClose, onSave }) {
  const [imageUrl, setImageUrl] = useState(item?.image_url || '')
  const [caption, setCaption] = useState(item?.caption || '')
  const [tags, setTags] = useState(item?.tags?.join(', ') || '')
  const [sourceUrl, setSourceUrl] = useState(item?.source_url || '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [instagramUrl, setInstagramUrl] = useState('')
  const [fetchingInstagram, setFetchingInstagram] = useState(false)
  const [instagramError, setInstagramError] = useState('')

  const fetchInstagramPost = async () => {
    if (!instagramUrl.trim()) return
    
    // Validate Instagram URL
    const igUrlPattern = /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/
    const match = instagramUrl.match(igUrlPattern)
    
    if (!match) {
      setInstagramError('Please enter a valid Instagram post URL (e.g., instagram.com/p/ABC123)')
      return
    }

    setFetchingInstagram(true)
    setInstagramError('')

    const postId = match[1]
    const postUrl = `https://www.instagram.com/p/${postId}/`

    try {
      // Try using a CORS proxy to fetch the Instagram page
      // We'll extract the image from the page's meta tags
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(postUrl)}`
      
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error('Could not fetch Instagram post')
      }
      
      const html = await response.text()
      
      // Extract image from og:image meta tag
      const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                          html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i)
      
      // Extract description from og:description or description meta tag
      const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i) ||
                         html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
      
      if (ogImageMatch && ogImageMatch[1]) {
        // Decode HTML entities in the URL
        const imgUrl = ogImageMatch[1].replace(/&amp;/g, '&')
        setImageUrl(imgUrl)
      } else {
        throw new Error('Could not find image in Instagram post')
      }
      
      if (ogDescMatch && ogDescMatch[1]) {
        // Decode HTML entities and clean up the caption
        let captionText = ogDescMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
        
        // Instagram descriptions often start with "X likes, Y comments - Username:"
        // Try to extract just the caption part
        const captionMatch = captionText.match(/:\s*"(.+)"/) || 
                            captionText.match(/:\s*(.+)$/)
        if (captionMatch) {
          captionText = captionMatch[1].replace(/^"|"$/g, '')
        }
        
        setCaption(captionText)
      }
      
      // Set source URL
      setSourceUrl(postUrl)
      
      // Clear the input
      setInstagramUrl('')
      
    } catch (error) {
      console.error('Instagram fetch error:', error)
      
      // Provide helpful error message
      setInstagramError(
        'Failed to fetch Instagram post. Try: Open the post → Right-click image → "Copy image address" → Paste in Image URL field below'
      )
    } finally {
      setFetchingInstagram(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const url = await uploadImage(file)
      setImageUrl(url)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!imageUrl) {
      alert('Please add an image')
      return
    }

    setSaving(true)
    const data = {
      image_url: imageUrl,
      caption: caption.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      source_url: sourceUrl.trim(),
    }
    await onSave(data)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-xl font-medium text-stone-900">
            {item ? 'Edit Inspiration' : 'Add Inspiration'}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Instagram Import */}
          {!item && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-sm border border-purple-200">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                📸 Import from Instagram
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => {
                    setInstagramUrl(e.target.value)
                    setInstagramError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), fetchInstagramPost())}
                  placeholder="Paste Instagram post URL..."
                  className="flex-1 text-sm"
                  disabled={fetchingInstagram}
                />
                <button
                  type="button"
                  onClick={fetchInstagramPost}
                  disabled={fetchingInstagram || !instagramUrl.trim()}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {fetchingInstagram ? 'Fetching...' : 'Import'}
                </button>
              </div>
              {instagramError && (
                <p className="text-red-600 text-sm mt-2">{instagramError}</p>
              )}
              <p className="text-xs text-purple-600 mt-2">
                Paste a link like instagram.com/p/ABC123 to auto-fill image and caption
              </p>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Image *
            </label>
            
            {imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-full max-h-48 object-contain rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Upload button */}
                <label className={`flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-stone-300 rounded-sm cursor-pointer hover:border-stone-400 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <span className="text-stone-500">Uploading...</span>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-stone-400" />
                      <span className="text-stone-500">Upload image</span>
                    </>
                  )}
                </label>

                <div className="text-center text-sm text-stone-400">or</div>

                {/* URL input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="url"
                      placeholder="Paste image URL..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Caption / Notes
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What inspires you about this?"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              <Tag className="w-4 h-4 inline mr-1" />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., sakura, pink, crudo, plating"
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Source URL (optional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Link to original post or recipe..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !imageUrl}
              className="btn-primary flex-1"
            >
              {saving ? 'Saving...' : item ? 'Update' : 'Add Inspiration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// View Modal Component
function ViewModal({ item, onClose, onEdit, onDelete, onCreateRecipe }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-sm max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div className="flex-1 bg-stone-100 flex items-center justify-center min-h-[300px]">
          <img
            src={item.image_url}
            alt={item.caption || 'Inspiration'}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Details */}
        <div className="w-full md:w-80 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-stone-900">Details</h3>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {item.caption && (
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Caption</label>
                <p className="text-stone-700 mt-1">{item.caption}</p>
              </div>
            )}

            {item.tags?.length > 0 && (
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {item.source_url && (
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Source</label>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-orange-600 hover:underline mt-1 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  View original
                </a>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wide">Added</label>
              <p className="text-stone-600 text-sm mt-1">
                {new Date(item.created_at).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-stone-200 mt-4">
            <button
              onClick={onCreateRecipe}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              Create Recipe from This
            </button>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 text-orange-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
