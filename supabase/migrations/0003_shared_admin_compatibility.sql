-- Additive compatibility objects for the shared admin panel schema.
-- Existing tables are preserved; apply this only after comparing column names in the shared project.
create table if not exists public.user_contact_info (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  whatsapp_number text,
  whatsapp_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null,
  title text not null,
  description text not null,
  item_type text,
  expected_price_pkr numeric(14,2),
  city text,
  whatsapp_number text,
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending','reviewing','needs_info','approved','rejected','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.admin_request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.admin_contact_requests(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image','video')),
  created_at timestamptz not null default now()
);
create index if not exists admin_contact_requests_user_idx on public.admin_contact_requests(user_id, created_at desc);
create index if not exists admin_request_media_request_idx on public.admin_request_media(request_id);
alter table public.user_contact_info enable row level security;
alter table public.admin_contact_requests enable row level security;
alter table public.admin_request_media enable row level security;
drop policy if exists user_contact_owner on public.user_contact_info;
drop policy if exists admin_contact_owner on public.admin_contact_requests;
drop policy if exists admin_contact_media_owner on public.admin_request_media;
create policy user_contact_owner on public.user_contact_info for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy admin_contact_owner on public.admin_contact_requests for insert with check (user_id = auth.uid() and consent = true);
create policy admin_contact_owner_read on public.admin_contact_requests for select using (user_id = auth.uid() or public.is_admin());
create policy admin_contact_media_owner on public.admin_request_media for all using (exists (select 1 from public.admin_contact_requests r where r.id = request_id and (r.user_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.admin_contact_requests r where r.id = request_id and (r.user_id = auth.uid() or public.is_admin())));
insert into storage.buckets(id, name, public) values ('voice-messages','voice-messages',false) on conflict (id) do nothing;
drop policy if exists voice_messages_participant_read on storage.objects;
drop policy if exists voice_messages_participant_insert on storage.objects;
create policy voice_messages_participant_read on storage.objects for select using (bucket_id = 'voice-messages' and exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id = m.conversation_id where m.voice_path = name and cp.user_id = auth.uid()));
create policy voice_messages_participant_insert on storage.objects for insert with check (bucket_id = 'voice-messages' and auth.uid()::text = split_part(name, '/', 1) and public.is_conversation_member(split_part(name, '/', 2)::uuid));
