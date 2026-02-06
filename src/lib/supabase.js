import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://daunspyxksozxbnjvaju.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdW5zcHl4a3Nvenhibmp2YWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODE5NzQsImV4cCI6MjA4MzY1Nzk3NH0.JEjGJWGnN6b8m6Q6OMNXYKjRNZectzh0FgvnM40Hdeo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return true
}

// Image upload helper
export const uploadImage = async (file) => {
  const fileExt = file.name.split('.').pop().toLowerCase()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${fileName}`

  console.log('Uploading image:', { fileName, fileSize: file.size, fileType: file.type })

  const { data: uploadData, error } = await supabase.storage
    .from('recipe-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  console.log('Upload successful:', uploadData)

  const { data } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(filePath)

  console.log('Public URL:', data.publicUrl)
  return data.publicUrl
}

// For demo/development, we'll use localStorage as a fallback
const STORAGE_KEY = 'nomi_recipes'
const AUTH_KEY = 'nomi_auth'

// Local storage helpers for demo mode
export const localStore = {
  getRecipes: () => {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  },
  
  saveRecipes: (recipes) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  },
  
  addRecipe: (recipe) => {
    const recipes = localStore.getRecipes()
    const newRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    recipes.push(newRecipe)
    localStore.saveRecipes(recipes)
    return newRecipe
  },
  
  updateRecipe: (id, updates) => {
    const recipes = localStore.getRecipes()
    const index = recipes.findIndex(r => r.id === id)
    if (index !== -1) {
      recipes[index] = { 
        ...recipes[index], 
        ...updates, 
        updated_at: new Date().toISOString() 
      }
      localStore.saveRecipes(recipes)
      return recipes[index]
    }
    return null
  },
  
  deleteRecipe: (id) => {
    const recipes = localStore.getRecipes()
    const filtered = recipes.filter(r => r.id !== id)
    localStore.saveRecipes(filtered)
    return true
  },
  
  getRecipeById: (id) => {
    const recipes = localStore.getRecipes()
    return recipes.find(r => r.id === id) || null
  },

  // Simple auth for demo
  getAuth: () => {
    const data = localStorage.getItem(AUTH_KEY)
    return data ? JSON.parse(data) : null
  },

  setAuth: (user) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  },

  clearAuth: () => {
    localStorage.removeItem(AUTH_KEY)
  }
}

// Database service
export const db = {
  recipes: {
    async getAll() {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    
    async getComponents() {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, image_url')
        .eq('is_component', true)
        .order('title', { ascending: true })
      if (error) throw error
      return data
    },
    
    async getById(id) {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    
    async getByIds(ids) {
      if (!ids || ids.length === 0) return []
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .in('id', ids)
      if (error) throw error
      return data
    },
    
    async create(recipe) {
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipe])
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async update(id, updates) {
      const { data, error } = await supabase
        .from('recipes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    
    async delete(id) {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  menus: {
    async getAll() {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .order('event_date', { ascending: false })
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async create(menu) {
      const { data, error } = await supabase
        .from('menus')
        .insert([menu])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('menus')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  inspirations: {
    async getAll() {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async create(inspiration) {
      const { data, error } = await supabase
        .from('inspirations')
        .insert([inspiration])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('inspirations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  ingredients: {
    async getAll() {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async search(query) {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(20)
      if (error) throw error
      return data
    },

    async getByCategory(category) {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('category', category)
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },

    async create(ingredient) {
      const { data, error } = await supabase
        .from('ingredients')
        .insert([ingredient])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async createMany(ingredients) {
      // Insert in batches of 50 to avoid timeouts
      const batchSize = 50
      const results = []
      
      for (let i = 0; i < ingredients.length; i += batchSize) {
        const batch = ingredients.slice(i, i + batchSize)
        const { data, error } = await supabase
          .from('ingredients')
          .insert(batch)
          .select()
        if (error) throw error
        results.push(...data)
      }
      
      return results
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('ingredients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  testSchedule: {
    async getAll() {
      const { data, error } = await supabase
        .from('test_schedule')
        .select('*, recipes(id, title, image_url)')
        .order('scheduled_date', { ascending: true })
      if (error) throw error
      return data
    },

    async getByDateRange(startDate, endDate) {
      const { data, error } = await supabase
        .from('test_schedule')
        .select('*, recipes(id, title, image_url)')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
      if (error) throw error
      return data
    },

    async create(schedule) {
      const { data, error } = await supabase
        .from('test_schedule')
        .insert([schedule])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('test_schedule')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('test_schedule')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  testingRounds: {
    async getAll() {
      const { data, error } = await supabase
        .from('testing_rounds')
        .select('*')
        .order('start_date', { ascending: false })
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('testing_rounds')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async create(round) {
      const { data, error } = await supabase
        .from('testing_rounds')
        .insert([round])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('testing_rounds')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('testing_rounds')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    },

    async toggleRecipeTested(roundId, recipeId, tested) {
      const round = await this.getById(roundId)
      const testedIds = round.tested_recipe_ids || []
      
      let updatedTestedIds
      if (tested) {
        updatedTestedIds = [...new Set([...testedIds, recipeId])]
      } else {
        updatedTestedIds = testedIds.filter(id => id !== recipeId)
      }
      
      return this.update(roundId, { tested_recipe_ids: updatedTestedIds })
    }
  },

  shoppingLists: {
    async getAll() {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },

    async getById(id) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },

    async create(list) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([list])
        .select()
        .single()
      if (error) throw error
      return data
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('shopping_lists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  },

  recipeIngredients: {
    async getByRecipeId(recipeId) {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .select('*, ingredients(*)')
        .eq('recipe_id', recipeId)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data
    },

    async setForRecipe(recipeId, ingredients) {
      // Delete existing ingredients for this recipe
      const { error: deleteError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId)
      if (deleteError) throw deleteError

      // Insert new ingredients (including headings)
      if (ingredients.length > 0) {
        const rows = ingredients.map((ing, index) => {
          if (ing.is_heading) {
            return {
              recipe_id: recipeId,
              is_heading: true,
              heading_text: ing.heading_text || null,
              sort_order: index,
              ingredient_id: null,
              quantity: null,
              unit: null,
              preparation: null,
              is_optional: false,
              notes: null
            }
          }
          return {
            recipe_id: recipeId,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity !== '' && ing.quantity != null ? parseFloat(ing.quantity) : null,
            unit: ing.unit || null,
            preparation: ing.preparation || null,
            is_optional: ing.is_optional || false,
            is_heading: false,
            heading_text: null,
            sort_order: index,
            notes: ing.notes || null
          }
        })
        
        const { error: insertError } = await supabase
          .from('recipe_ingredients')
          .insert(rows)
        if (insertError) throw insertError
      }
      
      return true
    },

    async create(recipeIngredient) {
      const { data, error } = await supabase
        .from('recipe_ingredients')
        .insert([recipeIngredient])
        .select('*, ingredients(*)')
        .single()
      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('id', id)
      if (error) throw error
      return true
    }
  }
}
