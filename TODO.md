# Abuzuriaz Cattle Farm — Delivery TODO

## Public brand shell and route foundation
- [ ] Build a responsive public website branded **Abuzuriaz Cattle Farm** with the tagline **Fresh Milk | Healthy Animals | Trusted Marketplace.** Use deep forest green, white, natural beige, and subtle gold accents; use farm imagery, custom cow-and-leaves branding, accessible controls, skeleton loaders, empty states, safe errors, rounded cards, and subtle motion.
- [ ] Register all requested public routes and keep browsing available without sign-in: Home, Our Farm, Cattle Zone, Fresh Milk, Dairy Products, Buy & Sell Marketplace, Create Post, Post Details, Order Milk, Delivery Information, Notifications, My Orders, My Posts, About Us, Contact Us, Privacy Policy, Terms, and `/404`.
- [ ] Serve `GET /manus-routes.json` with the complete page route set, including the dynamic post-details pattern, and keep it synchronized with source routes.

## Supabase data foundation
- [ ] Add additive-safe SQL migrations, indexes, relationships, constraints, timestamps, ownership fields, and RLS policies for `profiles`, `cattle`, `milk_products`, `milk_inventory`, `orders`, `order_items`, `marketplace_posts`, `marketplace_media`, `notifications`, `delivery_addresses`, `reports`, and `farm_settings`; if compatible tables already exist, extend them without destructive replacement.
- [ ] Add secure Supabase Storage buckets and policies for livestock images, marketplace media, and farm gallery content; restrict upload type and size, keep owner/admin access enforced, and expose only approved public media.
- [ ] Add a browser-safe Supabase client using only public URL/anon-key placeholders. Never expose service-role keys or other secrets in browser code. When Supabase is not configured, show an honest setup/empty state rather than fake live data.

## Home and farm discovery
- [ ] Build Home with a genuine farm hero image, today's available milk in liters, current milk price per liter, current animal availability count, featured cattle categories, featured dairy products, latest approved marketplace posts, farm photo/video gallery, milk ordering entry point, and Buy & Sell entry point. Quantities, prices, inventory, counts, and posts must come from Supabase; testimonials and contact/WhatsApp/phone/location details appear only when configured by the administrator.
- [ ] Build Our Farm, About Us, Contact Us, Delivery Information, Privacy Policy, and Terms pages. Contact details must remain unconfigured until stored in farm settings.

## Livestock catalogue
- [ ] Build Cattle Zone for cows, buffaloes, goats, sheep, calves, bulls, and other livestock. Each listing must support title/category, breed, age, gender, health details, weight where available, verified daily milk yield where relevant, PKR price, Available/Reserved/Sold status, multiple photos, optional video, description, location, and contact/action buttons.
- [ ] Add search, category filters, price range, sorting, pagination, loading states, empty states, and a clear distinction between administrator-managed farm inventory and user marketplace listings.

## Milk and dairy ordering
- [ ] Build Fresh Milk and Dairy Products pages with configurable cow milk, buffalo milk, and other milk types, configurable price per liter, daily production, available stock in liters, quantity choices such as 1/5/10/20 liters, product detail, and no hardcoded live inventory.
- [ ] Build cart and order confirmation with delivery date, time slot, address, contact number, optional recurring delivery request, configurable payment options, and statuses Pending, Confirmed, Preparing, Out for Delivery, Delivered, and Cancelled.
- [ ] Validate stock and deduct it atomically through a safe server-side database operation; prevent orders exceeding available inventory; keep order history private; never claim online payment success without a real provider confirmation.

## Marketplace and moderation
- [ ] Build marketplace browsing with approved posts, category/location filtering, price sorting, search, pagination, verified-farm versus user-submitted labels, and a post details page with seller contact options.
- [ ] Build Create Post with title, category, description, asking price, location, contact details, multiple image uploads, optional video, seller identity, creation date, status, preview, upload validation/progress, and auth gating.
- [ ] Allow only owners to edit/delete their own posts, let sellers mark a post sold, provide a report listing action, implement admin approval/moderation states, and prevent users from impersonating the farm administrator.

## Auth, private records, and notifications
- [ ] Add a secure supported Supabase identity flow for creating posts, placing orders, and accessing private user data. Anonymous visitors must not see private account data. Enforce user ownership and admin-only operations server-side and through RLS.
- [ ] Build Notifications, My Orders, and My Posts with persisted notifications and read/unread states for new milk orders, order status changes, new marketplace posts, approval/rejection, relevant marketplace updates, and administrator announcements. Use Realtime where configured and do not claim browser push without permission/subscription/delivery infrastructure.
- [ ] Add validation and abuse protection for public forms and uploads, safe error handling, and responsive account navigation.

## Documentation and delivery
- [ ] Add `.env.example` with placeholders only for Supabase public configuration and optional farm settings; add a README with local setup, Supabase migrations, Auth, Storage/RLS, and Vercel deployment steps, plus an honest list of remaining manual credentials/configuration.
- [ ] Run TypeScript checks, tests, production build, route manifest checks, and focused verification of public browsing, authenticated actions, database reads/writes, RLS intent, and storage policy definitions. Resolve actionable diagnostics and runtime/build errors before checkpointing.
- [ ] Save the completed coding to the project’s canonical repository/main checkpoint. Do not enable automatic publication or claim a Vercel URL unless the connected deployment succeeds.
