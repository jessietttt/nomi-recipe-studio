// Add this SQL to Supabase to create the inspirations table:
/*
CREATE TABLE inspirations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  tags JSONB DEFAULT '[]',
  source_url TEXT,
  linked_recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON inspirations FOR ALL USING (true) WITH CHECK (true);
*/
