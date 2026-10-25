# Abuzuriaz Cattle Farm

A public-first farm website and marketplace for **Abuzuriaz Cattle Farm** with fresh milk ordering, livestock discovery, moderated buy-and-sell listings, favorites, WhatsApp contact, private text messaging, and supported-device voice messages.

The existing React / TypeScript / Vite / Express starter has been extended rather than replaced. Public catalogue browsing does not require an account. Creating posts, placing orders, saving favorites, messaging sellers, and reading private activity require Supabase Auth.

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The development server listens on port 3000 by default. `pnpm check`, `pnpm test`, and `pnpm build` run type checks, tests, and the production build.

## Supabase setup

Create a Supabase project, then set these browser-safe values in `.env` or in Vercel:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

The client also supports the legacy `VITE_SUPABASE_ANON_KEY` fallback for existing projects. Never place a service-role key in Vite, GitHub, or public Vercel variables.

Run both migrations in order:

```text
supabase/migrations/0001_farm_marketplace.sql
supabase/migrations/0002_accounts_messaging_favorites.sql
```

The migrations provide additive tables, indexes, status constraints, RLS, public approved-listing policies, private conversation policies, private voice storage, favorites, a profile trigger with unique username generation, and the atomic `place_milk_order` RPC. Review the migration in a staging Supabase project before applying to production.

After applying migrations:

1. Enable Google OAuth and email/password in Supabase Auth. Add local and deployed callback URLs, including the final Vercel origin and `/` redirect.
2. Create or update the first farm administrator profile with `role = 'admin'` after the corresponding Auth user exists.
3. Add the public `farm_settings` row, approved cattle, milk products, today's inventory, and owner-uploaded farm media.
4. Review Storage policies for `livestock-media`, `marketplace-media`, `farm-gallery`, and private `private-voice` before accepting production uploads.
5. Test anonymous browsing versus authenticated listing, order, favorite, message, notification, and profile access with two separate users.

New registrations create a profile automatically with a unique username based on the user's name/email plus a numeric suffix. Users can update their display name; username is not used as proof of identity.

## Marketplace behavior

User livestock posts stay `pending` until an authorized admin approves them. The form supports animal type, category, breed, breed/caste, age, gender, color, health/vaccination details, delivery/pickup details, fixed or negotiable PKR price, location, WhatsApp, phone, multiple images, and optional short video. Approved listing details expose only the seller contact options the seller submitted. WhatsApp numbers accept Pakistan formats such as `03XXXXXXXXX` or `+92...` and are normalized into a prefilled `wa.me` link.

The listing detail page supports WhatsApp contact, a private Message Seller action, favorite/save, and report. Private Messages supports text plus browser `MediaRecorder` voice upload when the device grants microphone access; unsupported devices receive a clear fallback instead of a fake success state.

## Routes

The public route manifest is available at `/manus-routes.json`. Main pages include `/`, `/farm`, `/cattle`, `/milk`, `/dairy`, `/marketplace`, `/marketplace/new`, `/marketplace/:id`, `/order`, `/delivery`, `/notifications`, `/messages`, `/account`, `/my-orders`, `/my-posts`, `/about`, `/contact`, `/privacy`, and `/terms`.

## Media and brand assets

The generated farm visuals are referenced from project-managed `/manus-storage/` paths. The website also includes a custom cow-and-leaves favicon at `client/public/favicon.svg`. Replace generated imagery with owner-uploaded farm media when available and confirm that every public image is licensed or owned by the farm.

## Vercel deployment

This repository uses Vite + Express rather than Next.js, so keep its existing build contract. In Vercel set the project root to the repository root, use the existing `pnpm build` command, and provide:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

If the existing Supabase project still uses the legacy anon key, use `VITE_SUPABASE_ANON_KEY` consistently instead; do not mix names without updating the environment and code. Do not add service-role credentials to client-facing Vercel variables. Run both Supabase migrations separately before accepting orders or uploads.

Configure Supabase Auth Site URL and redirect URLs for local development and the exact deployed Vercel domain. Verify case-sensitive routes, `/manus-routes.json`, image/storage URLs, runtime health, and production build output. This repository's checked build passes; a Vercel deployment cannot be claimed until the user's Vercel project and environment variables are connected.

Online payments are not integrated by this repository; cash on delivery remains the only honest default until a real provider and webhook confirmation are configured.

## Honest remaining setup

The code includes the requested secure frontend flows and migrations, but production behavior still depends on the user's Supabase project, Auth provider settings, admin profile, seeded farm data, approved media, storage review, Vercel environment variables, final legal copy, and end-to-end testing against real RLS policies. No fake live statistics, invented farm contact details, or false payment confirmations are included.
