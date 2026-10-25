# Abuzuriaz Cattle Farm

A public-first farm website and marketplace for **Abuzuriaz Cattle Farm** with fresh milk ordering, livestock discovery, and moderated buy-and-sell listings.

The existing React / TypeScript / Vite / Express starter has been extended rather than replaced. The UI is responsive for Android phones, tablets, laptops, and desktop browsers. Public catalogue browsing does not require an account. Creating posts, placing orders, and reading private activity require Supabase Auth.

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The development server listens on port 3000 by default. `pnpm check`, `pnpm test`, and `pnpm build` run type checks, tests, and the production build.

## Supabase setup

Create a Supabase project, then set these browser-safe values in `.env` or in the deployment environment:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/migrations/0001_farm_marketplace.sql` in the Supabase SQL editor or through the Supabase CLI. The migration is additive-safe for the requested tables and includes indexes, status constraints, Row Level Security, storage buckets/policies, and the `place_milk_order` RPC. The RPC locks today's inventory row, validates stock, creates the order and line item, and deducts available liters atomically.

After applying the migration:

1. Enable the Supabase Auth provider you want to use. The current UI uses email one-time links and can be extended with phone OTP.
2. Create the first farm administrator profile by inserting or updating a row in `public.profiles` with `role = 'admin'` after the corresponding Auth user exists.
3. Add farm settings in `public.farm_settings` using the `public` row. Contact details, location, delivery notes, and testimonials are intentionally not displayed until configured.
4. Add approved cattle, milk products, today's inventory, and farm-owned media. Public data appears only under the relevant RLS conditions.
5. Review Storage policies for `livestock-media`, `marketplace-media`, and `farm-gallery` before accepting uploads in production.

The browser only uses the Supabase URL and anon key. Never place `SUPABASE_SERVICE_ROLE_KEY` in Vite environment variables or client code.

## Routes

The public route manifest is available at `/manus-routes.json`. Main pages include `/`, `/farm`, `/cattle`, `/milk`, `/dairy`, `/marketplace`, `/marketplace/new`, `/marketplace/:id`, `/order`, `/delivery`, `/notifications`, `/account`, `/my-orders`, `/my-posts`, `/about`, `/contact`, `/privacy`, and `/terms`.

## Media and brand assets

The generated farm visuals are referenced from project-managed `/manus-storage/` paths. The website also includes a custom cow-and-leaves favicon at `client/public/favicon.svg`. Replace generated imagery with owner-uploaded farm media when available and confirm that every public image is licensed or owned by the farm.

## Vercel deployment

The current project includes an Express runtime and a Dockerfile, so the managed Webdev publication path is the safest default. If deploying to Vercel, connect the canonical repository, set the project root to this directory, use the framework's Vite/Node build configuration, and add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in Vercel for Preview and Production. Do not add service-role credentials to Vercel client-facing variables. Run the Supabase migration separately before accepting orders.

Before public launch, verify Auth redirect URLs for the final Vercel origin, Storage upload limits, RLS policies, farm admin role, delivery coverage, payment configuration, and the final Privacy Policy/Terms copy. Online payments are not integrated by this repository; cash on delivery remains the only honest default until a real provider and webhook confirmation are configured.

## Honest remaining setup

The repository can render the full public UI and its authenticated action flows, but live prices, inventory, approved listings, contact details, notifications, and order writes need a configured Supabase project and seeded farm data. Vercel publication also needs the user's connected repository/deployment authorization. No fake live statistics or invented farm contact details are included.
