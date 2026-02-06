-- NOMI Recipe Studio - Schema Update
-- Run these SQL commands in Supabase SQL Editor

-- ============================================
-- 1. Add new columns to recipes table
-- ============================================
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS extra_image_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cost_notes TEXT;

-- ============================================
-- 1b. Add new columns to menus table
-- ============================================
ALTER TABLE menus ADD COLUMN IF NOT EXISTS ticket_price DECIMAL(10,2);

-- ============================================
-- 2. Create ingredients table
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- Pantry, Produce, Protein, Dairy, Spice, Condiment, etc.
  subcategory TEXT, -- More specific: Japanese, Australian Native, etc.
  form TEXT, -- Powder, Liquid, Whole, Flakes, etc.
  default_unit TEXT, -- g, ml, pieces, etc.
  
  -- Inventory tracking
  quantity_on_hand DECIMAL(10,2) DEFAULT 0,
  unit_on_hand TEXT,
  expiry_date DATE,
  
  -- Cost tracking
  cost_per_unit DECIMAL(10,2),
  cost_unit TEXT, -- per 100g, per kg, per piece, etc.
  currency TEXT DEFAULT 'MXN',
  
  -- Sourcing
  supplier TEXT, -- Toyo, Tapias, Market, Supermarket, etc.
  origin_country TEXT,
  
  -- Notes and metadata
  dietary_info TEXT[], -- Vegan, GF, etc.
  storage_notes TEXT,
  primary_uses TEXT, -- Savory, Sweet, Both
  recipe_ideas TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON ingredients FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. Create test_schedule table
-- ============================================
CREATE TABLE IF NOT EXISTS test_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  test_type TEXT, -- frying, raw, sauce, make-ahead
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
  scale_factor DECIMAL(3,2) DEFAULT 1.0, -- 0.25 = quarter batch, 1.0 = full
  sort_order INTEGER DEFAULT 0, -- for ordering tests within a day
  notes TEXT,
  
  -- Link to menu if testing for specific event
  menu_id UUID REFERENCES menus(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add sort_order column if table already exists
ALTER TABLE test_schedule ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE test_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON test_schedule FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. Create shopping_lists table
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'draft', -- draft, finalized, completed
  
  -- Items stored as JSONB array
  -- Each item: { ingredient_id, ingredient_name, quantity_needed, unit, category, supplier, checked }
  items JSONB DEFAULT '[]',
  
  -- Link to test schedule or menu
  test_schedule_ids UUID[],
  menu_id UUID REFERENCES menus(id),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON shopping_lists FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. Create recipe_ingredients junction table
-- (for linking recipes to ingredients with quantities)
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2),
  unit TEXT,
  preparation TEXT, -- diced, minced, etc.
  is_optional BOOLEAN DEFAULT false,
  is_heading BOOLEAN DEFAULT false,
  heading_text TEXT,
  sort_order INTEGER DEFAULT 0,
  notes TEXT
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON recipe_ingredients FOR ALL USING (true) WITH CHECK (true);

-- Add new columns to existing recipe_ingredients table
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS is_heading BOOLEAN DEFAULT false;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS heading_text TEXT;
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
-- Remove the unique constraint since headings don't have ingredient_id
ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;

-- ============================================
-- 6. Create testing_rounds table
-- ============================================
CREATE TABLE IF NOT EXISTS testing_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, archived
  notes TEXT, -- General notes for the round (e.g., "edible flowers didn't last")
  
  -- Recipe IDs stored as array
  recipe_ids UUID[] DEFAULT '{}',
  
  -- Track which recipes have been tested in this round
  tested_recipe_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testing_rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON testing_rounds FOR ALL USING (true) WITH CHECK (true);
