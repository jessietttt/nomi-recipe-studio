import { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { uploadImage } from '../lib/supabase'

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const url = await uploadImage(file)
      onChange(url)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Recipe"
            className="w-40 h-32 object-cover rounded-sm"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-40 h-32 border-2 border-dashed border-stone-300 rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-stone-400 transition-colors ${
            uploading ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {uploading ? (
            <Loader className="w-6 h-6 text-stone-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-stone-400 mb-1" />
              <span className="text-xs text-stone-500">Upload image</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Fallback URL input */}
      <div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL..."
          className="text-sm"
        />
      </div>
    </div>
  )
}
