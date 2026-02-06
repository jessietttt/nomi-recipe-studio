import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Calendar,
  Flame,
  Fish,
  Soup,
  Clock,
  Check,
  GripVertical,
  ChefHat,
  Printer,
  ShoppingCart,
  Link as LinkIcon
} from 'lucide-react'
import { db } from '../lib/supabase'

const TEST_TYPES = [
  { id: 'frying', label: 'Frying Day', icon: Flame, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'raw', label: 'Raw Day', icon: Fish, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'sauce', label: 'Sauce Day', icon: Soup, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'make-ahead', label: 'Make-Ahead', icon: Clock, color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'general', label: 'General', icon: ChefHat, color: 'bg-stone-100 text-stone-700 border-stone-200' },
]

const STATUS_OPTIONS = [
  { id: 'scheduled', label: 'Scheduled', color: 'bg-amber-100 text-amber-700' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-stone-100 text-stone-500' },
]

export default function TestingScheduler() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'week' or 'month'
  const [schedules, setSchedules] = useState([])
  const [recipes, setRecipes] = useState([])
  const [menus, setMenus] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [editingSchedule, setEditingSchedule] = useState(null)
  
  // Drag state
  const [draggedRecipe, setDraggedRecipe] = useState(null)
  const [draggedSchedule, setDraggedSchedule] = useState(null)
  
  // Sidebar expand state
  const [showAllRecipes, setShowAllRecipes] = useState(false)
  
  // Day detail modal state
  const [dayDetailDate, setDayDetailDate] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load each independently to prevent one failure from blocking others
      const [schedulesData, recipesData, menusData, ingredientsData] = await Promise.all([
        db.testSchedule.getAll().catch(err => {
          console.error('Error loading schedules:', err)
          return []
        }),
        db.recipes.getAll().catch(err => {
          console.error('Error loading recipes:', err)
          return []
        }),
        db.menus.getAll().catch(err => {
          console.error('Error loading menus:', err)
          return []
        }),
        db.ingredients.getAll().catch(err => {
          console.error('Error loading ingredients:', err)
          return []
        })
      ])
      setSchedules(schedulesData || [])
      setRecipes(recipesData || [])
      setMenus(menusData || [])
      setIngredients(ingredientsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calendar navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar days
  const getCalendarDays = () => {
    const days = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (view === 'month') {
      // Get first day of month and how many days
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startDayOfWeek = firstDay.getDay()

      // Add empty days for padding
      for (let i = 0; i < startDayOfWeek; i++) {
        const prevDate = new Date(year, month, -startDayOfWeek + i + 1)
        days.push({ date: prevDate, isCurrentMonth: false })
      }

      // Add days of month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true })
      }

      // Add trailing days
      const remainingDays = 42 - days.length // 6 rows * 7 days
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
      }
    } else {
      // Week view
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek)
        day.setDate(startOfWeek.getDate() + i)
        days.push({ date: day, isCurrentMonth: true })
      }
    }

    return days
  }

  // Helper to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    const dateStr = formatDateLocal(date)
    return schedules.filter(s => s.scheduled_date === dateStr)
  }

  // Format date for display
  const formatMonthYear = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    return currentDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
  }

  // Check if date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Handle day click
  const handleDayClick = (date) => {
    setSelectedDate(date)
    setEditingSchedule(null)
    setShowAddModal(true)
  }

  // Handle schedule click
  const handleScheduleClick = (e, schedule) => {
    e.stopPropagation()
    setEditingSchedule(schedule)
    setSelectedDate(new Date(schedule.scheduled_date))
    setShowAddModal(true)
  }

  // Handle drag start for sidebar recipes
  const handleDragStart = (e, recipe) => {
    setDraggedRecipe(recipe)
    setDraggedSchedule(null)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag start for existing scheduled items
  const handleScheduleDragStart = (e, schedule) => {
    e.stopPropagation()
    setDraggedSchedule(schedule)
    setDraggedRecipe(null)
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleScheduleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedSchedule(null)
  }

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Handle drop
  const handleDrop = async (e, date) => {
    e.preventDefault()
    const dateStr = formatDateLocal(date)

    // Dropping a new recipe from sidebar
    if (draggedRecipe) {
      try {
        await db.testSchedule.create({
          recipe_id: draggedRecipe.id,
          scheduled_date: dateStr,
          test_type: 'general',
          status: 'scheduled',
        })
        await loadData()
      } catch (error) {
        console.error('Error creating schedule:', error)
      }
      setDraggedRecipe(null)
      return
    }

    // Moving an existing scheduled item to a new date
    if (draggedSchedule) {
      // Don't do anything if dropping on the same date
      if (draggedSchedule.scheduled_date === dateStr) {
        setDraggedSchedule(null)
        return
      }

      try {
        await db.testSchedule.update(draggedSchedule.id, {
          scheduled_date: dateStr,
        })
        await loadData()
      } catch (error) {
        console.error('Error moving schedule:', error)
      }
      setDraggedSchedule(null)
    }
  }

  // Save schedule
  const handleSaveSchedule = async (scheduleData) => {
    try {
      if (editingSchedule) {
        await db.testSchedule.update(editingSchedule.id, scheduleData)
      } else {
        await db.testSchedule.create(scheduleData)
      }
      await loadData()
      setShowAddModal(false)
      setEditingSchedule(null)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    }
  }

  // Delete schedule
  const handleDeleteSchedule = async (id) => {
    if (!confirm('Delete this test?')) return
    try {
      await db.testSchedule.delete(id)
      await loadData()
      setShowAddModal(false)
      setEditingSchedule(null)
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  // Mark as complete
  const handleMarkComplete = async (e, schedule) => {
    e.stopPropagation()
    try {
      await db.testSchedule.update(schedule.id, { 
        status: schedule.status === 'completed' ? 'scheduled' : 'completed' 
      })
      await loadData()
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  const calendarDays = getCalendarDays()

  // Get upcoming menus for the sidebar
  const upcomingMenus = menus
    .filter(m => new Date(m.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5)

  // Get recipes that need testing (not menu-ready) - include components!
  const recipesToTest = recipes
    .filter(r => r.status !== 'menu-ready')
    .sort((a, b) => a.title.localeCompare(b.title))
  
  const displayedRecipes = showAllRecipes ? recipesToTest : recipesToTest.slice(0, 10)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-medium text-stone-900 mb-1">
            Testing Schedule
          </h1>
          <p className="text-stone-500">
            Plan and track your recipe testing days • <Link to="/testing/rounds" className="text-orange-600 hover:underline">Testing Rounds →</Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border border-stone-300 rounded-sm overflow-hidden">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-sm ${view === 'month' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm border-l border-stone-300 ${view === 'week' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm border-l border-stone-300 ${view === 'day' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-sm shadow-sm">
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-stone-100 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-medium text-stone-900">
                {formatMonthYear()}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-orange-600 hover:underline"
              >
                Today
              </button>
            </div>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-stone-100 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid - Month/Week View */}
          {view !== 'day' && (
            <div className="bg-white rounded-sm shadow-sm overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-stone-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-stone-500 bg-stone-50">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className={`grid grid-cols-7 ${view === 'week' ? '' : 'grid-rows-6'}`}>
                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                  const daySchedules = getSchedulesForDate(date)
                  const isDropTarget = draggedRecipe !== null || draggedSchedule !== null

                  return (
                    <div
                      key={index}
                      onClick={() => handleDayClick(date)}
                      onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, date)}
                    className={`
                      min-h-[100px] ${view === 'week' ? 'min-h-[200px]' : ''} p-1 border-b border-r border-stone-100 cursor-pointer
                      transition-colors
                      ${!isCurrentMonth ? 'bg-stone-50/50' : 'hover:bg-stone-50'}
                      ${isToday(date) ? 'bg-orange-50' : ''}
                      ${isDropTarget ? 'hover:bg-green-50' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday(date) ? 'bg-orange-500 text-white' : ''}
                      ${!isCurrentMonth ? 'text-stone-300' : 'text-stone-700'}
                    `}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {daySchedules.slice(0, view === 'week' ? 10 : 3).map(schedule => {
                        const testType = TEST_TYPES.find(t => t.id === schedule.test_type) || TEST_TYPES[4]
                        const recipe = schedule.recipes || recipes.find(r => r.id === schedule.recipe_id)
                        
                        return (
                          <div
                            key={schedule.id}
                            draggable
                            onDragStart={(e) => handleScheduleDragStart(e, schedule)}
                            onDragEnd={handleScheduleDragEnd}
                            onClick={(e) => handleScheduleClick(e, schedule)}
                            className={`
                              text-xs p-1 rounded border truncate cursor-grab active:cursor-grabbing
                              ${testType.color}
                              ${schedule.status === 'completed' ? 'opacity-60 line-through' : ''}
                              ${schedule.status === 'cancelled' ? 'opacity-40 line-through' : ''}
                            `}
                          >
                            {recipe?.title || 'Unknown recipe'}
                          </div>
                        )
                      })}
                      {daySchedules.length > (view === 'week' ? 10 : 3) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setDayDetailDate(date)
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 pl-1 text-left"
                        >
                          +{daySchedules.length - (view === 'week' ? 10 : 3)} more
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )}

          {/* Day View */}
          {view === 'day' && (
            <DayView
              date={currentDate}
              schedules={getSchedulesForDate(currentDate)}
              recipes={recipes}
              ingredients={ingredients}
              onScheduleClick={(schedule) => {
                setEditingSchedule(schedule)
                setSelectedDate(new Date(schedule.scheduled_date))
                setShowAddModal(true)
              }}
              onAddClick={() => {
                setSelectedDate(currentDate)
                setEditingSchedule(null)
                setShowAddModal(true)
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, currentDate)}
              onScheduleDragStart={handleScheduleDragStart}
              onScheduleDragEnd={handleScheduleDragEnd}
              onReorder={async (reorderedSchedules) => {
                // Update order in database
                for (let i = 0; i < reorderedSchedules.length; i++) {
                  await db.testSchedule.update(reorderedSchedules[i].id, { sort_order: i })
                }
                await loadData()
              }}
            />
          )}

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {TEST_TYPES.map(type => (
              <div key={type.id} className="flex items-center gap-1.5 text-xs">
                <div className={`w-3 h-3 rounded ${type.color.split(' ')[0]}`} />
                <span className="text-stone-600">{type.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-72 space-y-6">
          {/* Recipes to Test */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4" />
              Recipes to Test
              <span className="text-xs text-stone-400 font-normal">({recipesToTest.length})</span>
            </h3>
            <p className="text-xs text-stone-500 mb-3">
              Drag recipes onto calendar days
            </p>
            <div className={`space-y-2 ${showAllRecipes ? 'max-h-96' : 'max-h-64'} overflow-y-auto`}>
              {recipesToTest.length === 0 ? (
                <p className="text-sm text-stone-400">All recipes are menu-ready!</p>
              ) : (
                displayedRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, recipe)}
                    className="flex items-center gap-2 p-2 bg-stone-50 rounded cursor-move hover:bg-stone-100 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-stone-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-700 truncate flex items-center gap-1">
                        {recipe.title}
                        {recipe.is_component && (
                          <span className="text-[10px] px-1 py-0.5 bg-purple-100 text-purple-600 rounded">C</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        {recipe.status === 'to-test' ? 'To Test' : 
                         recipe.status === 'retest' ? 'Retest' :
                         recipe.status === 'testing' ? 'Testing' : 
                         recipe.status === 'menu-ready' ? 'Menu Ready' : 'Inspiration'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recipesToTest.length > 10 && (
              <button 
                onClick={() => setShowAllRecipes(!showAllRecipes)}
                className="text-xs text-orange-600 hover:underline block text-center pt-3 w-full"
              >
                {showAllRecipes ? 'Show less' : `Show all ${recipesToTest.length} recipes`}
              </button>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-sm shadow-sm p-4">
            <h3 className="font-medium text-stone-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Upcoming Events
            </h3>
            <div className="space-y-2">
              {upcomingMenus.length === 0 ? (
                <p className="text-sm text-stone-400">No upcoming events</p>
              ) : (
                upcomingMenus.map(menu => (
                  <Link
                    key={menu.id}
                    to={`/menus/${menu.id}`}
                    className="block p-2 bg-stone-50 rounded hover:bg-stone-100 transition-colors"
                  >
                    <div className="text-sm font-medium text-stone-700">
                      {menu.name}
                    </div>
                    <div className="text-xs text-stone-400">
                      {new Date(menu.event_date).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short'
                      })}
                      {menu.guest_count && ` • ${menu.guest_count} guests`}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {dayDetailDate && (
        <DayDetailModal
          date={dayDetailDate}
          schedules={getSchedulesForDate(dayDetailDate)}
          recipes={recipes}
          onScheduleClick={(schedule) => {
            setDayDetailDate(null)
            setEditingSchedule(schedule)
            setSelectedDate(new Date(schedule.scheduled_date))
            setShowAddModal(true)
          }}
          onAddClick={() => {
            setDayDetailDate(null)
            setSelectedDate(dayDetailDate)
            setEditingSchedule(null)
            setShowAddModal(true)
          }}
          onClose={() => setDayDetailDate(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <ScheduleModal
          date={selectedDate}
          schedule={editingSchedule}
          recipes={recipes}
          menus={menus}
          onSave={handleSaveSchedule}
          onDelete={editingSchedule ? () => handleDeleteSchedule(editingSchedule.id) : null}
          onClose={() => {
            setShowAddModal(false)
            setEditingSchedule(null)
          }}
        />
      )}
    </div>
  )
}

// Helper to format date as YYYY-MM-DD in local timezone
const formatDateLocal = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Schedule Modal Component
function ScheduleModal({ date, schedule, recipes, menus, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState({
    recipe_id: schedule?.recipe_id || '',
    scheduled_date: schedule?.scheduled_date || formatDateLocal(date),
    test_type: schedule?.test_type || 'general',
    status: schedule?.status || 'scheduled',
    menu_id: schedule?.menu_id || '',
    notes: schedule?.notes || '',
    scale_factor: schedule?.scale_factor || 1,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.recipe_id) {
      alert('Please select a recipe')
      return
    }
    onSave({
      ...formData,
      menu_id: formData.menu_id || null,
      scale_factor: parseFloat(formData.scale_factor) || 1,
    })
  }

  const upcomingMenus = menus.filter(m => new Date(m.event_date) >= new Date())

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div 
          className="bg-white rounded-sm max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">
              {schedule ? 'Edit Test' : 'Schedule Test'}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-3 space-y-3">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
                className="py-2"
              />
            </div>

          {/* Recipe */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Recipe *
            </label>
            <select
              value={formData.recipe_id}
              onChange={(e) => setFormData({ ...formData, recipe_id: e.target.value })}
              required
            >
              <option value="">Select a recipe...</option>
              <optgroup label="Recipes">
                {recipes.filter(r => !r.is_component).sort((a, b) => a.title.localeCompare(b.title)).map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Components">
                {recipes.filter(r => r.is_component).sort((a, b) => a.title.localeCompare(b.title)).map(recipe => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Test Type */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Test Type
            </label>
            <div className="grid grid-cols-3 gap-1">
              {TEST_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, test_type: type.id })}
                  className={`
                    flex items-center justify-center gap-1 p-1.5 rounded border text-xs transition-colors
                    ${formData.test_type === type.id ? type.color + ' border-current' : 'border-stone-200 hover:bg-stone-50'}
                  `}
                >
                  <type.icon className="w-3 h-3" />
                  {type.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {schedule && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Status
              </label>
              <div className="flex gap-1">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: status.id })}
                    className={`
                      px-2 py-1 rounded text-xs transition-colors
                      ${formData.status === status.id ? status.color : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}
                    `}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Link to Menu */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Testing for Event (optional)
            </label>
            <select
              value={formData.menu_id}
              onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })}
            >
              <option value="">No specific event</option>
              {upcomingMenus.map(menu => (
                <option key={menu.id} value={menu.id}>
                  {menu.name} ({new Date(menu.event_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Any notes for this test..."
              className="py-2 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={onClose} className="btn-secondary text-sm py-1.5 px-3">
                Cancel
              </button>
              <button type="submit" className="btn-primary text-sm py-1.5 px-3">
                {schedule ? 'Save' : 'Schedule'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

// Day Detail Modal Component
function DayDetailModal({ date, schedules, recipes, onScheduleClick, onAddClick, onClose }) {
  const formatDate = (d) => {
    return d.toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div 
          className="bg-white rounded-sm max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-900">
              {formatDate(date)}
            </h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
            {schedules.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-4">No tests scheduled</p>
            ) : (
              schedules.map(schedule => {
                const testType = TEST_TYPES.find(t => t.id === schedule.test_type) || TEST_TYPES[4]
                const recipe = schedule.recipes || recipes.find(r => r.id === schedule.recipe_id)
                
                return (
                  <button
                    key={schedule.id}
                    onClick={() => onScheduleClick(schedule)}
                    className={`
                      w-full text-left p-2 rounded border transition-colors
                      ${testType.color}
                      ${schedule.status === 'completed' ? 'opacity-60' : ''}
                      hover:opacity-80
                    `}
                  >
                    <div className={`font-medium text-sm ${schedule.status === 'completed' ? 'line-through' : ''}`}>
                      {recipe?.title || 'Unknown recipe'}
                    </div>
                    <div className="text-xs opacity-75 flex items-center gap-2 mt-0.5">
                      <testType.icon className="w-3 h-3" />
                      {testType.label}
                      {schedule.status !== 'scheduled' && ` • ${schedule.status}`}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="p-3 border-t border-stone-200">
            <button
              onClick={onAddClick}
              className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({ date, schedules, recipes, ingredients, onScheduleClick, onAddClick, onDragOver, onDrop, onScheduleDragStart, onScheduleDragEnd, onReorder }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [activeTab, setActiveTab] = useState('flow') // 'flow', 'shopping'

  // Sort schedules by sort_order or id
  const sortedSchedules = [...schedules].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  // Handle internal reordering
  const handleInternalDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleInternalDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex !== null && dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleInternalDrop = async (e, dropIndex) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newSchedules = [...sortedSchedules]
    const [draggedItem] = newSchedules.splice(draggedIndex, 1)
    newSchedules.splice(dropIndex, 0, draggedItem)
    
    // Update sort_order for all items
    const updatedSchedules = newSchedules.map((item, i) => ({
      ...item,
      sort_order: i
    }))
    
    setDraggedIndex(null)
    setDragOverIndex(null)
    
    // Call parent's onReorder to save to database and refresh
    if (onReorder) {
      await onReorder(updatedSchedules)
    }
  }

  const handleInternalDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Parse ingredients from recipe HTML
  const parseIngredients = (html) => {
    if (!html) return []
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    const listItems = temp.querySelectorAll('li')
    if (listItems.length > 0) {
      return Array.from(listItems).map(li => li.textContent.trim()).filter(Boolean)
    }
    
    const text = temp.textContent || temp.innerText
    return text.split(/[\n\r]+|•|·/).map(l => l.trim()).filter(l => l.length > 0)
  }

  // Parse equipment from recipe HTML
  const parseEquipment = (html) => {
    if (!html) return []
    const temp = document.createElement('div')
    temp.innerHTML = html
    
    const listItems = temp.querySelectorAll('li')
    if (listItems.length > 0) {
      return Array.from(listItems).map(li => li.textContent.trim()).filter(Boolean)
    }
    
    const text = temp.textContent || temp.innerText
    return text.split(/[\n\r]+|•|·|,/).map(l => l.trim()).filter(l => l.length > 0)
  }

  // Generate shopping list
  const generateShoppingList = () => {
    const items = []
    sortedSchedules.forEach(schedule => {
      const recipe = recipes.find(r => r.id === schedule.recipe_id)
      if (recipe) {
        const ingredients = parseIngredients(recipe.ingredients)
        ingredients.forEach(ing => {
          items.push({ ingredient: ing, recipe: recipe.title })
        })
      }
    })
    return items
  }

  // Get all equipment needed
  const getAllEquipment = () => {
    const equipment = new Set()
    sortedSchedules.forEach(schedule => {
      const recipe = recipes.find(r => r.id === schedule.recipe_id)
      if (recipe?.equipment) {
        parseEquipment(recipe.equipment).forEach(eq => equipment.add(eq))
      }
    })
    return Array.from(equipment)
  }

  const handlePrint = () => {
    window.print()
  }

  const allEquipment = getAllEquipment()
  const shoppingList = generateShoppingList()

  return (
    <div 
      className="bg-white rounded-sm shadow-sm"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Day Header with Tabs */}
      <div className="border-b border-stone-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Tab buttons */}
            <div className="flex border border-stone-300 rounded-sm overflow-hidden">
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-3 py-1.5 text-sm ${activeTab === 'flow' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                Testing Flow
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-3 py-1.5 text-sm border-l border-stone-300 ${activeTab === 'shopping' ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                Shopping ({shoppingList.length})
              </button>
            </div>
            <span className="text-sm text-stone-500">
              {sortedSchedules.length} {sortedSchedules.length === 1 ? 'test' : 'tests'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-stone-900 text-white rounded hover:bg-stone-800"
            >
              <Plus className="w-4 h-4" />
              Add Test
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Summary - show on all tabs */}
      {allEquipment.length > 0 && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Equipment Needed</h4>
          <div className="flex flex-wrap gap-2">
            {allEquipment.map((eq, i) => (
              <span key={i} className="text-xs px-2 py-1 bg-white rounded border border-amber-200 text-amber-700">
                {eq}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'flow' && (
        <div className="p-4">
          {sortedSchedules.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <p className="mb-2">No tests scheduled for this day</p>
              <p className="text-sm">Drag recipes here or click "Add Test"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSchedules.map((schedule, index) => {
                const testType = TEST_TYPES.find(t => t.id === schedule.test_type) || TEST_TYPES[4]
                const recipe = recipes.find(r => r.id === schedule.recipe_id)
                
                return (
                  <div
                    key={schedule.id}
                    draggable
                    onDragStart={(e) => handleInternalDragStart(e, index)}
                    onDragOver={(e) => handleInternalDragOver(e, index)}
                    onDrop={(e) => handleInternalDrop(e, index)}
                    onDragEnd={handleInternalDragEnd}
                    onClick={() => onScheduleClick(schedule)}
                    className={`
                      flex items-start gap-4 p-4 rounded-sm border cursor-pointer transition-all
                      ${testType.color}
                      ${schedule.status === 'completed' ? 'opacity-60' : ''}
                      ${dragOverIndex === index ? 'border-t-4 border-t-orange-400' : ''}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 opacity-50 cursor-grab" />
                      <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium text-lg ${schedule.status === 'completed' ? 'line-through' : ''}`}>
                        {recipe?.title || 'Unknown recipe'}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm opacity-75">
                        <span className="flex items-center gap-1">
                          <testType.icon className="w-4 h-4" />
                          {testType.label}
                        </span>
                        {schedule.status !== 'scheduled' && (
                          <span className="flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            {schedule.status}
                          </span>
                        )}
                      </div>
                      {schedule.notes && (
                        <p className="mt-2 text-sm opacity-75">{schedule.notes}</p>
                      )}
                      {recipe?.equipment && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {parseEquipment(recipe.equipment).map((eq, i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 bg-white/50 rounded">
                              {eq}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {recipe && (
                      <Link
                        to={`/recipes/${recipe.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm opacity-75 hover:opacity-100 flex items-center gap-1"
                      >
                        <LinkIcon className="w-4 h-4" />
                        Recipe
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shopping' && (
        <ShoppingTab items={shoppingList} pantryIngredients={ingredients} />
      )}
    </div>
  )
}

// Shopping Tab Component (inline in Day View)
function ShoppingTab({ items, pantryIngredients = [] }) {
  const [checkedItems, setCheckedItems] = useState(new Set())
  const [groupBy, setGroupBy] = useState('none') // 'none', 'recipe', 'supplier'

  const toggleItem = (index) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedItems(newChecked)
  }

  // Match shopping list item to pantry ingredient (fuzzy match by name)
  const findPantryMatch = (ingredientText) => {
    if (!ingredientText || pantryIngredients.length === 0) return null
    
    const searchText = ingredientText.toLowerCase()
    
    // Try to find a matching pantry ingredient
    // First try exact match
    let match = pantryIngredients.find(p => 
      searchText.includes(p.name.toLowerCase()) || 
      p.name.toLowerCase().includes(searchText.split(' ').slice(-2).join(' '))
    )
    
    // If no match, try matching individual words
    if (!match) {
      const words = searchText.split(/\s+/).filter(w => w.length > 2)
      for (const word of words) {
        match = pantryIngredients.find(p => 
          p.name.toLowerCase().includes(word) || word.includes(p.name.toLowerCase())
        )
        if (match) break
      }
    }
    
    return match
  }

  // Enrich items with pantry data
  const enrichedItems = items.map((item, index) => {
    const pantryMatch = findPantryMatch(item.ingredient)
    return {
      ...item,
      index,
      supplier: pantryMatch?.supplier || null,
      costPerUnit: pantryMatch?.cost_per_unit || null,
      costUnit: pantryMatch?.cost_unit || null,
      pantryName: pantryMatch?.name || null
    }
  })

  // Group items by recipe
  const groupedByRecipe = enrichedItems.reduce((acc, item) => {
    if (!acc[item.recipe]) acc[item.recipe] = []
    acc[item.recipe].push(item)
    return acc
  }, {})

  // Group items by supplier
  const groupedBySupplier = enrichedItems.reduce((acc, item) => {
    const supplier = item.supplier || 'Unknown Supplier'
    if (!acc[supplier]) acc[supplier] = []
    acc[supplier].push(item)
    return acc
  }, {})

  // Sort suppliers with Unknown last
  const sortedSuppliers = Object.keys(groupedBySupplier).sort((a, b) => {
    if (a === 'Unknown Supplier') return 1
    if (b === 'Unknown Supplier') return -1
    return a.localeCompare(b)
  })

  const renderItem = (item, showRecipe = true, showSupplier = true) => (
    <label key={item.index} className="flex items-center gap-2 text-sm cursor-pointer py-1.5">
      <input
        type="checkbox"
        checked={checkedItems.has(item.index)}
        onChange={() => toggleItem(item.index)}
        className="rounded shrink-0"
      />
      <span className={`flex-1 ${checkedItems.has(item.index) ? 'line-through text-stone-400' : ''}`}>
        {item.ingredient}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {showSupplier && item.supplier && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
            {item.supplier}
          </span>
        )}
        {showRecipe && (
          <span className="text-xs text-stone-400">{item.recipe}</span>
        )}
      </div>
    </label>
  )

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500">{items.length} items</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="text-sm border border-stone-300 rounded px-2 py-1"
          >
            <option value="none">No grouping</option>
            <option value="recipe">Group by recipe</option>
            <option value="supplier">Group by supplier</option>
          </select>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50"
        >
          <Printer className="w-4 h-4" />
          Print List
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-stone-500">
          No ingredients to shop for
        </div>
      ) : groupBy === 'recipe' ? (
        <div className="space-y-4">
          {Object.entries(groupedByRecipe).map(([recipeName, recipeItems]) => (
            <div key={recipeName} className="border border-stone-200 rounded-sm">
              <div className="px-3 py-2 bg-stone-50 border-b border-stone-200">
                <h4 className="font-medium text-stone-700 text-sm">{recipeName}</h4>
              </div>
              <div className="p-3 space-y-0.5">
                {recipeItems.map(item => renderItem(item, false, true))}
              </div>
            </div>
          ))}
        </div>
      ) : groupBy === 'supplier' ? (
        <div className="space-y-4">
          {sortedSuppliers.map(supplier => (
            <div key={supplier} className="border border-stone-200 rounded-sm">
              <div className={`px-3 py-2 border-b border-stone-200 ${supplier === 'Unknown Supplier' ? 'bg-stone-50' : 'bg-blue-50'}`}>
                <h4 className={`font-medium text-sm ${supplier === 'Unknown Supplier' ? 'text-stone-500' : 'text-blue-700'}`}>
                  {supplier}
                  <span className="font-normal ml-2 text-xs opacity-75">
                    ({groupedBySupplier[supplier].length} items)
                  </span>
                </h4>
              </div>
              <div className="p-3 space-y-0.5">
                {groupedBySupplier[supplier].map(item => renderItem(item, true, false))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {enrichedItems.map(item => renderItem(item, true, true))}
        </div>
      )}
    </div>
  )
}

// Shopping List Modal for Day View
function ShoppingListModal({ items, title, onClose }) {
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

  // Group items by recipe
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.recipe]) acc[item.recipe] = []
    acc[item.recipe].push(item)
    return acc
  }, {})

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-white rounded-sm w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 shrink-0">
          <div>
            <h2 className="text-lg font-medium text-stone-900">Shopping List</h2>
            <p className="text-sm text-stone-500">{items.length} items</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-stone-300 rounded hover:bg-stone-50"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-stone-200 shrink-0">
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

        <div className="p-4 overflow-y-auto flex-1">
          {groupByRecipe ? (
            Object.entries(groupedItems).map(([recipeName, recipeItems]) => (
              <div key={recipeName} className="mb-4">
                <h4 className="font-medium text-stone-700 mb-2 text-sm">{recipeName}</h4>
                <div className="space-y-1 pl-2">
                  {recipeItems.map((item, idx) => {
                    const globalIndex = items.findIndex(i => i === item)
                    return (
                      <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(globalIndex)}
                          onChange={() => toggleItem(globalIndex)}
                          className="rounded"
                        />
                        <span className={checkedItems.has(globalIndex) ? 'line-through text-stone-400' : ''}>
                          {item.ingredient}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => (
                <label key={index} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(index)}
                    onChange={() => toggleItem(index)}
                    className="rounded"
                  />
                  <span className={checkedItems.has(index) ? 'line-through text-stone-400' : 'flex-1'}>
                    {item.ingredient}
                  </span>
                  <span className="text-xs text-stone-400">{item.recipe}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
