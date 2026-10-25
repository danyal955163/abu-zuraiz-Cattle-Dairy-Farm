

## Urdu-first shared admin-panel compatibility

The public website now opens in Urdu with RTL layout and four prominent sections: **ڈیش بورڈ**, **دستیاب اشیاء**, **مویشی منڈی**, and **ایڈمن سے رابطہ**. Public visitors can browse without login; login is required for posts, orders, private messages, favorites, and admin-contact requests. The site prefers approved records from the shared `listings` table and falls back to the earlier farm tables only when the shared table is unavailable, so the existing admin panel can remain the source of truth.

Apply `supabase/migrations/0003_shared_admin_compatibility.sql` only after comparing the real shared Supabase schema. It adds missing-compatible `user_contact_info`, `admin_contact_requests`, and `admin_request_media` objects only when they do not already exist, plus private `voice-messages` storage policies. Existing admin-created offers should use `listings.source = 'admin'`; user marketplace records should use `listings.source = 'user'` and `status = 'approved'` before public display. Admin moderation remains server/RLS controlled and user requests never auto-publish.

The Urdu contact form stores pending admin requests with consent and optional media. The website does not invent contact numbers; WhatsApp is displayed only when a valid number is supplied on an approved listing.
