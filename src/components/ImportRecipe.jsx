import { useState } from 'react'
import { Link2, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { scrapeRecipe } from '../lib/scraper'

export default function ImportRecipe({ onImport }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleImport = async () => {
    if (!url.trim()) return
    
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const result = await scrapeRecipe(url.trim())
      
      if (result.success) {
        onImport(result.data)
        setSuccess(true)
        setUrl('')
        
        if (result.partial) {
          setError('Partial import: some fields may need manual entry')
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to import recipe')
      }
    } catch (err) {
      setError('Failed to import recipe. Please try again or enter manually.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleImport()
    }
  }

  return (
    <div className="mb-8 p-4 bg-stone-50 rounded-sm">
      <h3 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Import from URL
      </h3>
      
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste recipe URL (e.g., from Bon Appétit, SBS Food...)"
          className="flex-1"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="btn-secondary px-4 flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import'
          )}
        </button>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-orange-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
      
      {success && !error && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Recipe imported! Review and edit below.
        </p>
      )}
      
      <p className="mt-2 text-xs text-stone-500">
        Works with: Australian Gourmet Traveller, SBS Food, Great British Chefs, Bon Appétit, and most recipe sites
      </p>
    </div>
  )
}
