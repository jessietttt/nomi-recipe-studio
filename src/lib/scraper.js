// Recipe scraper utility
// Uses a CORS proxy to fetch external recipe pages and extract data

// Try multiple CORS proxies in case one fails
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
]

// Clean text helper
function cleanText(text) {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim()
}

// Generic schema.org recipe parser
function parseSchemaRecipe(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  
  for (const script of scripts) {
    try {
      let data = JSON.parse(script.textContent)
      
      if (Array.isArray(data)) {
        data = data.find(item => item['@type'] === 'Recipe') || data[0]
      }
      
      if (data['@graph']) {
        data = data['@graph'].find(item => item['@type'] === 'Recipe')
      }
      
      if (data && (data['@type'] === 'Recipe' || data['@type']?.includes('Recipe'))) {
        const ingredients = data.recipeIngredient
        const instructions = data.recipeInstructions
        
        return {
          title: data.name || '',
          description: data.description || '',
          image_url: extractImage(data.image),
          ingredients: ingredients ? formatIngredients(ingredients) : '',
          instructions: instructions ? formatInstructions(instructions) : '',
          prep_time: parseDuration(data.prepTime),
          cook_time: parseDuration(data.cookTime),
          rest_time: '',
          servings: parseServings(data.recipeYield),
        }
      }
    } catch (e) {
      console.log('Failed to parse JSON-LD:', e)
    }
  }
  
  return null
}

function extractImage(image) {
  if (!image) return ''
  if (typeof image === 'string') return image
  if (Array.isArray(image)) return image[0]?.url || image[0] || ''
  if (image.url) return image.url
  return ''
}

function formatIngredients(ingredients) {
  if (!ingredients) return ''
  if (Array.isArray(ingredients)) {
    return '<ul>' + ingredients.map(i => `<li>${cleanText(i)}</li>`).join('') + '</ul>'
  }
  return ingredients
}

function formatInstructions(instructions) {
  if (!instructions) return ''
  
  if (Array.isArray(instructions)) {
    const steps = instructions.map(step => {
      if (typeof step === 'string') return cleanText(step)
      if (step.text) return cleanText(step.text)
      return ''
    }).filter(Boolean)
    return '<ol>' + steps.map(s => `<li>${s}</li>`).join('') + '</ol>'
  }
  
  return instructions
}

function parseDuration(duration) {
  if (!duration) return ''
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (match) {
    const hours = match[1] ? parseInt(match[1]) : 0
    const minutes = match[2] ? parseInt(match[2]) : 0
    if (hours && minutes) return `${hours}h ${minutes}m`
    if (hours) return `${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes) return `${minutes} mins`
  }
  return duration
}

function parseServings(recipeYield) {
  if (!recipeYield) return ''
  if (typeof recipeYield === 'number') return recipeYield.toString()
  if (Array.isArray(recipeYield)) return recipeYield[0]?.toString() || ''
  const match = recipeYield.toString().match(/\d+/)
  return match ? match[0] : recipeYield.toString()
}

// Parse recipe from HTML using DOM
function parseRecipeFromDOM(doc, url) {
  const result = {
    title: '',
    description: '',
    image_url: '',
    ingredients: '',
    instructions: '',
    prep_time: '',
    cook_time: '',
    rest_time: '',
    servings: '',
    source_url: url,
  }

  // Title
  const h1 = doc.querySelector('h1')
  if (h1) result.title = cleanText(h1.textContent)

  // Image from og:image
  const ogImage = doc.querySelector('meta[property="og:image"]')
  if (ogImage) result.image_url = ogImage.getAttribute('content')

  // Description from meta
  const metaDesc = doc.querySelector('meta[name="description"]')
  if (metaDesc) result.description = metaDesc.getAttribute('content')

  // Get the full HTML as text for pattern matching
  const fullHTML = doc.body?.innerHTML || ''
  
  // Try to find ingredients using multiple patterns
  // Pattern 1: Look for h2 with "Ingredients" followed by content until h2 with "Method"
  const ingredientsMatch = fullHTML.match(/<h2[^>]*>\s*Ingredients\s*<\/h2>([\s\S]*?)<h2[^>]*>\s*Method/i)
  
  if (ingredientsMatch) {
    // Parse the HTML fragment to extract text from p tags
    const tempDiv = doc.createElement('div')
    tempDiv.innerHTML = ingredientsMatch[1]
    const paragraphs = tempDiv.querySelectorAll('p')
    const items = []
    paragraphs.forEach(p => {
      const text = cleanText(p.textContent)
      if (text && text.length > 2 && text.length < 300) {
        items.push(text)
      }
    })
    if (items.length > 0) {
      result.ingredients = '<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>'
    }
  }
  
  // Try to find method/instructions
  const methodMatch = fullHTML.match(/<h2[^>]*>\s*Method\s*<\/h2>([\s\S]*?)(?:<h2|<footer|class="tags"|Recipe Course|Cuisine:|$)/i)
  
  if (methodMatch) {
    const tempDiv = doc.createElement('div')
    tempDiv.innerHTML = methodMatch[1]
    const paragraphs = tempDiv.querySelectorAll('p')
    const steps = []
    paragraphs.forEach(p => {
      const text = cleanText(p.textContent)
      if (text && text.length > 15) {
        // Split by numbered patterns like "1.For" or "2.Place"
        const splitSteps = text.split(/(?=\d+\.)/).filter(s => s.trim().length > 10)
        if (splitSteps.length > 1) {
          splitSteps.forEach(step => {
            steps.push(step.replace(/^\d+\./, '').trim())
          })
        } else if (!text.match(/^>?\s*\*\*Wine/i) && !text.match(/^>?\s*Notes/i)) {
          steps.push(text)
        }
      }
    })
    if (steps.length > 0) {
      result.instructions = '<ol>' + steps.map(s => `<li>${s}</li>`).join('') + '</ol>'
    }
  }

  // Fallback: Try finding by element traversal if regex didn't work
  if (!result.ingredients || !result.instructions) {
    const h2Elements = doc.querySelectorAll('h2')
    let ingredientsH2 = null
    let methodH2 = null

    h2Elements.forEach(h2 => {
      const text = h2.textContent.toLowerCase().trim()
      if (text === 'ingredients') ingredientsH2 = h2
      if (text === 'method' || text === 'instructions' || text === 'directions') methodH2 = h2
    })

    // Extract ingredients
    if (ingredientsH2 && !result.ingredients) {
      const ingredientItems = []
      let currentEl = ingredientsH2.nextElementSibling
      
      while (currentEl && currentEl !== methodH2 && !currentEl.matches('h2')) {
        if (currentEl.matches('p')) {
          const text = cleanText(currentEl.textContent)
          if (text && text.length > 2 && text.length < 200) {
            ingredientItems.push(text)
          }
        }
        if (currentEl.matches('ul, ol')) {
          currentEl.querySelectorAll('li').forEach(li => {
            const text = cleanText(li.textContent)
            if (text && text.length > 2) {
              ingredientItems.push(text)
            }
          })
        }
        currentEl = currentEl.nextElementSibling
      }
      
      if (ingredientItems.length > 0) {
        result.ingredients = '<ul>' + ingredientItems.map(i => `<li>${i}</li>`).join('') + '</ul>'
      }
    }

    // Extract method/instructions
    if (methodH2 && !result.instructions) {
      const steps = []
      let currentEl = methodH2.nextElementSibling
      
      while (currentEl && !currentEl.matches('h2')) {
        if (currentEl.matches('p')) {
          const text = cleanText(currentEl.textContent)
          if (text && text.length > 10) {
            const splitSteps = text.split(/(?=\d+\.)/).filter(s => s.trim().length > 10)
            if (splitSteps.length > 1) {
              splitSteps.forEach(step => {
                steps.push(step.replace(/^\d+\./, '').trim())
              })
            } else {
              steps.push(text)
            }
          }
        }
        if (currentEl.matches('ol')) {
          currentEl.querySelectorAll('li').forEach(li => {
            const text = cleanText(li.textContent)
            if (text && text.length > 10) {
              steps.push(text)
            }
          })
        }
        currentEl = currentEl.nextElementSibling
      }
      
      if (steps.length > 0) {
        result.instructions = '<ol>' + steps.map(s => `<li>${s}</li>`).join('') + '</ol>'
      }
    }
  }

  // Servings - look for "Serves X" pattern
  const bodyText = doc.body?.textContent || ''
  const servesMatch = bodyText.match(/Serves\s*[\n\r\s]*(\d+)/i)
  if (servesMatch) result.servings = servesMatch[1]

  // Prep and cook times
  const prepMatch = bodyText.match(/Prep\s*[\n\r\s]*(\d+)M/i)
  if (prepMatch) result.prep_time = `${prepMatch[1]} mins`
  
  const cookMatch = bodyText.match(/Cook\s*[\n\r\s]*(\d+)M/i)
  if (cookMatch) result.cook_time = `${cookMatch[1]} mins`

  return result
}

async function fetchWithProxy(url, proxyIndex = 0) {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All CORS proxies failed')
  }
  
  try {
    const proxy = CORS_PROXIES[proxyIndex]
    const response = await fetch(proxy + encodeURIComponent(url))
    if (!response.ok) throw new Error('Fetch failed')
    return await response.text()
  } catch (e) {
    console.log(`Proxy ${proxyIndex} failed, trying next...`)
    return fetchWithProxy(url, proxyIndex + 1)
  }
}

export async function scrapeRecipe(url) {
  try {
    const html = await fetchWithProxy(url)
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Try JSON-LD schema first (most reliable when available)
    const schemaResult = parseSchemaRecipe(doc)
    if (schemaResult && schemaResult.title && schemaResult.ingredients) {
      return { success: true, data: { ...schemaResult, source_url: url } }
    }
    
    // Parse from DOM
    const domResult = parseRecipeFromDOM(doc, url)
    
    if (domResult && domResult.title) {
      const hasContent = domResult.ingredients || domResult.instructions
      return { 
        success: true, 
        data: domResult,
        partial: !hasContent
      }
    }
    
    return { success: false, error: 'Could not extract recipe data from this page' }
    
  } catch (error) {
    console.error('Scraping error:', error)
    return { success: false, error: error.message || 'Failed to fetch recipe' }
  }
}
