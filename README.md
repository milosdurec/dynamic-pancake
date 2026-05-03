# Dynamic Pancake

AI-powered food analysis web app — analyzes dish photos, finds recipes, generates shopping lists, assesses restaurant locations, and writes reviews.

**Built with:** Next.js 16 · Claude AI (claude-sonnet-4-6) · TypeScript · Tailwind CSS · Lucide Icons

---

## Features

| Step | Feature | Output language |
|------|---------|----------------|
| Photo Analysis | Upload or take a photo — Claude identifies all ingredients and estimates amounts | Slovak |
| Nutrition | Calculates calories, protein, carbs, fats, fiber per 100g and per serving | Slovak |
| Recipe | Finds the best-rated recipe with ingredients, steps, prep/cook time | Slovak |
| Shopping List | Scales the recipe for 5 people, groups by category, estimates cost | Slovak |
| Location | Assesses a restaurant by name + GPS — rating, pros/cons, recommendation | Slovak |
| Reviews | Generates Google & TripAdvisor reviews from your comments, in your style | English |

### Key UX decisions
- **All results visible at once** — no step-by-step wizard; panels auto-populate as data arrives
- **Camera support** — live camera capture via `getUserMedia` (rear camera on mobile), with file upload fallback
- **Auto-trigger pipeline** — photo upload → ingredients + nutrition fire in parallel → recipe → shopping list chains automatically
- **Skeleton loaders** — shimmer placeholders while each section loads
- **Copy to clipboard** — one-click copy for both reviews
- **Mobile-first** — single-column on mobile, 2-column grid on desktop

---

## Tech Stack

```
Next.js 16.2.4 (App Router, Turbopack)
React 19
TypeScript
Tailwind CSS v4
Lucide React (icons)
@anthropic-ai/sdk (Claude API)
```

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/dynamic-pancake.git
cd dynamic-pancake
npm install
```

### 2. Set up API key

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com). Requires a funded account (minimum $5 credit).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main dashboard — all panels, auto-trigger logic
│   ├── layout.tsx
│   ├── globals.css               # Tailwind + custom animations (shimmer, fade-up)
│   └── api/
│       ├── analyze-photo/        # Claude Vision — identifies ingredients
│       ├── nutrition/            # Calculates nutritional values
│       ├── recipe/               # Best-rated recipe generation
│       ├── shopping-list/        # Scales recipe × 5 people
│       ├── location/             # Restaurant location assessment
│       └── reviews/              # Google + TripAdvisor review generation
├── components/
│   ├── PhotoCapture.tsx          # Camera (getUserMedia) + file upload + drag & drop
│   ├── ui/
│   │   ├── Panel.tsx             # Section card with icon, title, status
│   │   ├── StatusBadge.tsx       # Loading / Done / Error badge
│   │   └── Skeleton.tsx          # Shimmer skeleton loaders
└── lib/
    ├── types.ts                  # All TypeScript interfaces
    ├── anthropic.ts              # Anthropic client singleton
    └── utils.ts                  # extractJSON, reformatAsJSON helpers
```

---

## API Routes

All routes are `POST`, return JSON, runtime `nodejs`.

### `POST /api/analyze-photo`
**Body:** `{ imageBase64: string, mediaType: string }`  
**Returns:** `{ dishName, ingredients[], confidence, notes? }`

### `POST /api/nutrition`
**Body:** `{ dishName, ingredients[] }`  
**Returns:** `{ dishName, servingSize, table[{ nutrient, per100g, perServing }] }`

### `POST /api/recipe`
**Body:** `{ dishName }`  
**Returns:** `{ dishName, source, rating?, prepTime?, cookTime?, servings, ingredients[], steps[] }`

### `POST /api/shopping-list`
**Body:** `{ dishName, ingredients[], people: 5 }`  
**Returns:** `{ dishName, people, items[{ name, amount, unit, category }], estimatedCost? }`

### `POST /api/location`
**Body:** `{ restaurantName, latitude?, longitude? }`  
**Returns:** `{ restaurantName, address?, rating?, priceRange?, specialties[], assessment, pros[], cons[], recommendation }`

### `POST /api/reviews`
**Body:** `{ restaurantName, userComments, dishName? }`  
**Returns:** `{ googleReview, tripAdvisorReview, starRating }`

---

## Auto-trigger Pipeline

```
User uploads photo
  └─► /api/analyze-photo
        ├─► /api/nutrition      (parallel)
        └─► /api/recipe         (parallel)
              └─► /api/shopping-list  (after recipe done)

User fills restaurant form
  └─► /api/location

User writes comments
  └─► /api/reviews
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key — [console.anthropic.com](https://console.anthropic.com) |

---

## Notes

- **Image size** — Keep photos under 5 MB. Supported formats: JPEG, PNG, WebP, GIF.
- **Mobile camera** — Uses `facingMode: environment` (rear camera). Falls back to file picker if camera is unavailable.
- **web_search tool** — Recipe and location use Claude's training knowledge. The `web_search_20260209` Anthropic built-in tool requires a specific Anthropic plan.

---

## License

MIT
