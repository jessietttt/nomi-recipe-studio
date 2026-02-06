import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'

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

// Placeholder images for recipes without photos
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&q=80',
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80',
]

function getPlaceholderImage(id) {
  const index = id ? id.charCodeAt(0) % PLACEHOLDER_IMAGES.length : 0
  return PLACEHOLDER_IMAGES[index]
}

export default function RecipeCard({ recipe, index = 0 }) {
  const {
    id,
    title,
    image_url,
    status = 'to-test',
    cuisine,
    course,
    dietary_tags = [],
    prep_time,
    servings,
  } = recipe

  // Handle both string and array for cuisine/course
  const cuisineArray = Array.isArray(cuisine) ? cuisine : (cuisine ? [cuisine] : [])
  const courseArray = Array.isArray(course) ? course : (course ? [course] : [])
  const displayTags = [...cuisineArray.slice(0, 1), ...courseArray.slice(0, 1), ...dietary_tags.slice(0, 1)].filter(Boolean)
  const imageUrl = image_url || getPlaceholderImage(id)

  return (
    <Link
      to={`/recipes/${id}`}
      className={`recipe-card block animate-slide-up stagger-${(index % 5) + 1}`}
      style={{ animationFillMode: 'both' }}
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden bg-stone-100 relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`status-badge ${STATUS_STYLES[status] || STATUS_STYLES.testing}`}>
            {STATUS_LABELS[status] || 'Testing'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-xl font-medium text-stone-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {displayTags.map((tag, i) => (
              <span key={i} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-stone-500">
          {prep_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {prep_time}
            </span>
          )}
          {servings && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {servings}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
