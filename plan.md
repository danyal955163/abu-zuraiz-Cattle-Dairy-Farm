# Abuzuriaz Cattle Farm — Implementation Plan

## Scope and implementation approach

Abuzuriaz Cattle Farm will be a public-first agricultural marketplace built by extending the existing React + TypeScript + Vite + Express + tRPC starter rather than replacing the working scaffold. Public browsing will work without sign-in. Mutating or private actions will use Supabase Auth and Row Level Security. The browser will use only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; no service-role key or other secret will enter client code.

The first complete implementation will ship the core public routes, a responsive home experience, cattle catalogue, milk and dairy catalogue, marketplace browsing/details/create flow, milk order flow, delivery information, account views, notifications, legal/contact/about pages, loading/error/empty states, and the shared navigation/footer system. Supabase SQL migrations will define the requested PostgreSQL tables, constraints, indexes, RLS policies, storage buckets/policies, and an order RPC that validates stock and deducts inventory server-side. The app will use real Supabase reads and writes when configured and will show an honest connection/setup state when the external project is not configured, never inventing live prices, inventory, animal counts, or approved posts.

The existing Express server will remain available for `/api/health` and platform runtime needs. Feature data will be organized in `client/src/lib` and reusable presentation components, while `client/src/pages` owns route-level views. The starter's existing auth and error boundary will be preserved where useful; Supabase session state will be added without exposing privileged credentials.

## Project structure

- `client/src/App.tsx`: route manifest and application providers.
- `client/src/pages/`: home, farm, cattle, milk, dairy, marketplace, post, order, account, informational, and legal pages.
- `client/src/components/`: farm header/footer, data cards, filters, authentication dialog, order/cart UI, connection-state messaging, and reusable accessible primitives.
- `client/src/lib/supabase.ts`: browser-safe Supabase client and typed helpers.
- `client/src/lib/farm-data.ts`: query/mutation functions for public listings, settings, orders, posts, media, and notifications.
- `client/src/index.css`: forest-green, warm-beige, cream, and muted-gold design tokens, typography, responsive layout, and motion rules.
- `supabase/migrations/`: additive PostgreSQL schema, functions, RLS, and storage policies; migrations will not destructively replace existing tables.
- `public/manus-routes.json`: complete route manifest for the public website.
- `.env.example`: placeholders for Supabase URL, anon key, and optional farm contact/configuration values only.
- `README.md`: setup, migration, storage, Auth, local development, and Vercel deployment instructions.

## Design direction

Three possible visual directions were considered: **Desert Provenance Editorial** (0.07), a warm editorial farm journal with tactile paper texture; **Modern Dairy Atelier** (0.05), a quiet premium cream-and-green product studio; and **Rural Field Notes** (0.04), a practical catalog with notebook-style utility. The selected direction is **Desert Provenance Editorial**.

### Design movement
A refined Pakistani farm identity combining editorial agriculture photography with modern hospitality signage and quiet natural luxury.

### Core principles
1. Lead with provenance: every product or listing should feel traceable to the farm or a clearly labeled seller.
2. Use calm hierarchy: generous cream space, restrained borders, and strong forest-green anchors make commerce feel trustworthy.
3. Make action obvious: quantity, price, delivery, contact, and next steps should be legible at a glance on an Android phone.
4. Keep data honest: live Supabase metrics are visually distinct from configured brand copy and from empty/setup states.

### Color philosophy
Forest green expresses healthy fields and confidence. Warm limestone/cream creates a sunlit, local material feel. Charcoal provides readable contrast. A single muted gold accent signals harvest, quality, and important actions without looking ornamental.

### Layout paradigm
Use a wide editorial composition with a left-aligned hero statement, a right-side photographic crop, and sections that alternate between full-bleed image bands and asymmetric content rails. Catalogues use an intentional filter rail and a flexible card flow instead of a generic centered dashboard grid.

### Signature elements
- A cow-and-leaf seal with a short rule line appears in the masthead, cards, and footer.
- Small uppercase eyebrow labels use tracked typography for provenance and category cues.
- Soft grain, warm border lines, and gold micro-accents create a print-like farm journal atmosphere while keeping controls modern.

### Interaction philosophy and animation
Interactions should feel calm and tactile: cards lift 2–4px on hover, filters transition in place, and order steps use a short fade/slide. Avoid excessive parallax or bouncing. Respect `prefers-reduced-motion`, keep focus rings visible, and use skeletons for all data-dependent content.

### Typography system
Use a distinctive serif display face for editorial headings and a clean sans-serif for controls and long-form copy. Headings use compact line-height and moderate tracking; buttons and data labels use the sans-serif at 12–14px with clear sentence case. The system falls back to Georgia/Arial without blocking rendering.

### Brand essence and voice
**Fresh farm supply and trusted livestock commerce for families, dairies, and buyers who want direct, transparent access to healthy animals and daily milk.** Personality: grounded, warm, dependable.

Headlines speak with confident specificity: “From our fields to your table.” CTAs are direct and useful: “Browse available animals” and “Order fresh milk.” Avoid generic claims, invented testimonials, and unconfigured contact details.

### Wordmark and logo
Use a simple cow-head silhouette nested inside two leaves, paired with a custom typographic wordmark treatment. The mark must remain recognizable at favicon size; the text wordmark is rendered in the interface so it stays crisp and accessible.

### Signature brand color
**Abuzuriaz Field Green**: a deep evergreen tone used for navigation, primary actions, and the core logo mark.

## Data and security decisions

Supabase is the requested external backend. The SQL migration will include `profiles`, `cattle`, `milk_products`, `milk_inventory`, `orders`, `order_items`, `marketplace_posts`, `marketplace_media`, `notifications`, `delivery_addresses`, `reports`, and `farm_settings`, with ownership fields, timestamps, validated numeric fields, status checks, indexes, and additive-safe `create table if not exists` patterns. Public rows will be readable only when approved/active; private rows will be owner-readable. Inserts and updates will require an authenticated user, and the farm-admin role will be enforced in policies and server-side checks. Storage policies will separate public approved media from owner/admin uploads.

Milk orders will call a PostgreSQL function/RPC that locks the selected inventory row, rejects insufficient stock, inserts the order, inserts order items, and decrements stock atomically. Payment status will remain pending/cash-on-delivery unless a real payment provider is configured. Notifications will be persisted with a read/unread flag; Realtime subscription will be added where credentials and table publication are available, without claiming browser push.

## Delivery workflow

Run `pnpm check`, `pnpm test`, and `pnpm build`; inspect route files, the route manifest, migration syntax, and the production start path. Commit application code, migrations, docs, and `.env.example` to the project’s canonical `main` remote after integrating remote changes. Vercel deployment remains a documented manual step unless a connected GitHub/Vercel integration is available; no secret will be invented or committed.


## Revision 2 — account, listing detail, messaging and deployment alignment

The original farm marketplace shell remains the implementation base. This revision adds real Supabase Auth choices (Google OAuth, email/password, reset and magic-link fallback), automatic profile/username creation, display-name settings, richer livestock metadata, Pakistan-aware WhatsApp links, favorites, private conversations, text messages, browser-supported voice recording with private Storage and signed playback URLs, and synchronized notifications/private account views. The second migration extends the existing schema additively and keeps all public reads limited to approved records.

The browser continues to use the compatible Vite variable names `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, with an explicit legacy anon-key fallback for existing projects. Vercel remains an external configuration step because no production Supabase or Vercel credentials are committed. The current build contract stays Vite + Express; no unnecessary Next.js migration is introduced into the working starter.

Remaining work is intentionally documented rather than faked: an admin dashboard for moderation/order operations, full owner edit/delete/mark-sold lifecycle, real Supabase/Google/Vercel setup, legal copy, staging RLS/Storage verification, and production end-to-end checks. The project remains deployable and the current TypeScript, test, and production-build checks pass.
