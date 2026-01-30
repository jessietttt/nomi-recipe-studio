# NOMI Recipe Studio

A personal recipe management app for testing, tracking, and organizing your culinary creations.

## Features

- **Recipe Library**: Grid view of all recipes with search and filters
- **Recipe Cards**: Clean cards showing title, status, tags, and key info
- **Recipe Detail**: Full view with ingredients, instructions, and testing notes
- **Testing Notes**: Track iterations and improvements for each recipe
- **Status Tracking**: Inspiration → Testing → Menu Ready
- **Filtering**: By status, cuisine, course, and dietary tags
- **Authentication**: Password-protected access

## Quick Start (Demo Mode)

The app works in demo mode using localStorage - no database setup required!

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:5173
# Demo password: nomi2026
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jessietttt/nomi-recipe-studio.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `nomi-recipe-studio` repository
4. Vercel will auto-detect Vite settings
5. Click "Deploy"

Your app will be live at `nomi-recipe-studio.vercel.app`!

## Adding Supabase (Optional - for persistent storage)

To move beyond localStorage and have proper database storage:

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API and copy your:
   - Project URL
   - anon/public key

### 2. Create Database Table

In Supabase SQL Editor, run:

```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'testing',
  cuisine TEXT,
  course TEXT,
  dietary_tags JSONB DEFAULT '[]',
  prep_time TEXT,
  cook_time TEXT,
  servings TEXT,
  ingredients TEXT,
  instructions TEXT,
  source_url TEXT,
  testing_notes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
```

### 3. Add Environment Variables

In Vercel (or locally in `.env`):

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app will automatically switch from localStorage to Supabase when these are set.

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Supabase** - Database (optional)
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/
│   ├── Header.jsx
│   └── RecipeCard.jsx
├── context/
│   └── AuthContext.jsx
├── lib/
│   └── supabase.js
├── pages/
│   ├── Login.jsx
│   ├── RecipeLibrary.jsx
│   ├── RecipeDetail.jsx
│   └── RecipeForm.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Customization

### Change Password

Edit `src/context/AuthContext.jsx`:

```javascript
const DEMO_PASSWORD = 'your-new-password'
```

### Add More Cuisines/Courses

Edit the options in `src/pages/RecipeForm.jsx` and `src/pages/RecipeLibrary.jsx`.

## Future Features (Coming Soon)

- [ ] Ingredient database with cost tracking
- [ ] Menu planning view
- [ ] Photo upload
- [ ] Web scraping for recipe import
- [ ] Event timeline builder

---

Built with 🍜 for NOMI popup dinners
