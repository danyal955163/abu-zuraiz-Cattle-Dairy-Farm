# Abuzuriaz Cattle Farm — Delivery TODO

## Delivered in the current GitHub-ready build

- [x] Responsive public brand shell branded **Abuzuriaz Cattle Farm** with forest green, beige, gold accents, custom cow-and-leaves favicon, farm imagery, accessible controls, empty/setup states, safe errors, and mobile/tablet/desktop layouts.
- [x] Public browsing routes for Home, Our Farm, Cattle Zone, Fresh Milk, Dairy Products, Buy & Sell Marketplace, Create Post, Post Details, Order Milk, Delivery Information, Notifications, Messages, Saved Listings, My Account, My Orders, My Posts, About Us, Contact Us, Privacy Policy, Terms, and `/404`; `/manus-routes.json` is synchronized.
- [x] Supabase migrations for profiles, cattle, milk products/inventory, orders/order items, delivery addresses, marketplace posts/media, notifications, reports, favorites, conversations, participants, messages, and private voice storage. RLS policies restrict private records to owners/participants and public reads to approved data.
- [x] Browser-safe Supabase client using only `VITE_SUPABASE_URL` plus publishable/legacy anon-key placeholders. Service-role credentials are not used in browser code. Unconfigured Supabase produces honest empty/setup states rather than fake live data.
- [x] Real Auth UI for Google OAuth, email/password sign-in and registration, email verification flow, password reset request, magic-link fallback, secure logout, and profile trigger with unique username generation.
- [x] Home live statistics, approved cattle catalogue, milk catalogue, daily inventory aggregation, marketplace browsing, order entry, private orders/posts/notifications, account profile settings, and favorite/save flow.
- [x] Create Post supports animal type, category, breed, breed/caste, age, gender, color, optional health/vaccination details, delivery/pickup details, PKR price, fixed/negotiable type, location, WhatsApp, phone, contact details, multiple images, optional short video, client file validation, and pending moderation status.
- [x] Approved listing details support seller label, price type, animal details, WhatsApp `wa.me` action with prefilled listing message, private Message Seller action, favorite/save, report, and safe contact display. Private messaging supports text and browser `MediaRecorder` voice uploads when microphone access is available, with signed private audio URLs and a five-second refresh strategy.
- [x] Atomic milk ordering RPC validates authenticated ownership, live product price, current stock, safe stock deduction, delivery address persistence, order creation, and private order notification. Cash on delivery is the only honest default payment method.
- [x] README, `.env.example`, migrations, Vercel variable names, Supabase Auth redirect guidance, Storage/RLS notes, route manifest, and remaining manual setup documented.
- [x] `pnpm check`, `pnpm test` (6 tests), and `pnpm build` pass; TypeScript diagnostics are registered. Build warnings are limited to runtime-managed farm image paths and the starter platform config script.

## Remaining production configuration and hardening

- [ ] Apply both migrations to the user's Supabase project in order, inspect the SQL in staging, enable RLS/Storage policies, and seed `farm_settings`, approved farm inventory, milk products, daily inventory, and approved media.
- [ ] Enable Google OAuth and email/password in Supabase Auth; configure local and exact Vercel Site URL/redirect URLs; verify email verification, password reset, and Google callback behavior.
- [ ] Create the first admin profile and build the admin moderation dashboard/API for approving, rejecting with a reason, marking sold, updating milk inventory/order status, and creating admin-owned listings. Public RLS already prevents ordinary users from changing moderation fields.
- [ ] Complete owner edit/delete/mark-sold UI and upload progress/preview gallery management; current submission upload validates files and stores media, while the full owner lifecycle remains to be connected to admin operations.
- [ ] Review private voice storage policy, file size/type limits, rate limiting, abuse reports/blocking controls, and signed URL expiry in a real Supabase staging project with two test users.
- [ ] Replace placeholder Privacy Policy and Terms copy with farm-approved legal language; configure real delivery areas, contact details, WhatsApp, phone, location, and payment/delivery policy.
- [ ] Connect the GitHub repository to the user's Vercel project, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or documented legacy fallback), run a real production deployment, and verify health, routes, image URLs, Auth, RLS, Storage, orders, messages, and notifications end to end.
- [ ] Do not claim a successful Vercel deployment or live payment success until those external configuration and verification steps complete.
