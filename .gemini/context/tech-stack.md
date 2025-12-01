# Tech Stack Reference

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3+ | UI framework |
| TypeScript | 5.5+ | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.4.x | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix primitives) |
| React Router | 6.x | Client-side routing |
| Lucide React | Latest | Icons |

## Backend (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL 15 | Primary database |
| Supabase Auth | Authentication (email/password, OAuth) |
| Supabase Storage | File storage with RLS |
| Supabase Realtime | Live data subscriptions |
| Edge Functions | Serverless Deno functions |

## Third-Party Integrations

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| Stripe | Payments & subscriptions | Edge Functions |
| BoldSign | E-signatures | Edge Functions |
| Resend | Transactional email | Edge Functions |
| Google Maps | Address autocomplete | Frontend (API key) |

## Development Tools

```bash
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build
npm run lint         # ESLint + TypeScript checking
npm run preview      # Preview production build

supabase start       # Start local Supabase
supabase stop        # Stop local Supabase
supabase db reset    # Reset database with migrations
supabase functions serve  # Run Edge Functions locally
```

## Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.80.x",
  "@stripe/react-stripe-js": "^2.x",
  "@stripe/stripe-js": "^2.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "date-fns": "^3.x"
}
```
