-- Abuzuriaz Cattle Farm: accounts, richer marketplace metadata, favorites and private messaging
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
create unique index if not exists profiles_username_unique_idx on public.profiles(username) where username is not null;

alter table public.marketplace_posts add column if not exists animal_type text;
alter table public.marketplace_posts add column if not exists breed_caste text;
alter table public.marketplace_posts add column if not exists age_months integer;
alter table public.marketplace_posts add column if not exists gender text;
alter table public.marketplace_posts add column if not exists color text;
alter table public.marketplace_posts add column if not exists health_vaccination text;
alter table public.marketplace_posts add column if not exists delivery_details text;
alter table public.marketplace_posts add column if not exists price_type text not null default 'negotiable';
alter table public.marketplace_posts add column if not exists whatsapp_number text;
alter table public.marketplace_posts add column if not exists phone_number text;
alter table public.marketplace_posts add column if not exists rejection_reason text;
alter table public.marketplace_posts add column if not exists origin text not null default 'user';
alter table public.marketplace_posts add column if not exists approved_at timestamptz;
do $$ begin alter table public.marketplace_posts add constraint marketplace_price_type_check check (price_type in ('fixed','negotiable')); exception when duplicate_object then null; end $$;
create index if not exists marketplace_animal_type_idx on public.marketplace_posts(animal_type);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.marketplace_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index if not exists favorites_user_idx on public.favorites(user_id, created_at desc);
alter table public.favorites enable row level security;
drop policy if exists favorites_owner on public.favorites;
create policy favorites_owner on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  voice_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint message_body_or_voice check (nullif(trim(body), '') is not null or voice_path is not null)
);
create index if not exists conversation_updated_idx on public.conversations(updated_at desc);
create index if not exists participants_user_idx on public.conversation_participants(user_id);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.conversation_participants where conversation_id = p_conversation_id and user_id = auth.uid()); $$;

drop policy if exists conversations_participant on public.conversations;
drop policy if exists conversations_insert on public.conversations;
drop policy if exists participants_member on public.conversation_participants;
drop policy if exists participants_insert on public.conversation_participants;
drop policy if exists messages_participant_read on public.messages;
drop policy if exists messages_participant_insert on public.messages;
drop policy if exists messages_participant_update on public.messages;
create policy conversations_participant on public.conversations for select using (public.is_conversation_member(id));
create policy conversations_insert on public.conversations for insert with check (auth.uid() is not null);
create policy participants_member on public.conversation_participants for select using (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy participants_insert on public.conversation_participants for insert with check (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy messages_participant_read on public.messages for select using (public.is_conversation_member(conversation_id));
create policy messages_participant_insert on public.messages for insert with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));
create policy messages_participant_update on public.messages for update using (public.is_conversation_member(conversation_id));

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_admin() then new.role := old.role; end if;
  new.id := old.id;
  return new;
end; $$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute procedure public.protect_profile_role();

create or replace function public.protect_marketplace_moderation()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if not public.is_admin() then
    new.status := old.status;
    new.rejection_reason := old.rejection_reason;
    new.approved_at := old.approved_at;
    new.is_farm_verified := old.is_farm_verified;
    new.origin := old.origin;
    new.seller_id := old.seller_id;
  end if;
  return new;
end; $$;
drop trigger if exists protect_marketplace_moderation on public.marketplace_posts;
create trigger protect_marketplace_moderation before update on public.marketplace_posts for each row execute procedure public.protect_marketplace_moderation();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare base text; candidate text; suffix integer := 100; created boolean := false;
begin
  base := regexp_replace(lower(coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, 'user'), '@', 1), 'user')), '[^a-z0-9]', '', 'g');
  if base = '' then base := 'user'; end if;
  while not created loop
    candidate := left(base, 24) || suffix::text;
    begin
      insert into public.profiles(id, full_name, display_name, username) values(new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'full_name', base), candidate);
      created := true;
    exception when unique_violation then suffix := suffix + 1;
    end;
  end loop;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Private voice recordings. Public listings continue using marketplace-media; chat audio never does.
insert into storage.buckets(id, name, public) values ('private-voice','private-voice',false) on conflict (id) do nothing;
drop policy if exists private_voice_participant_read on storage.objects;
drop policy if exists private_voice_participant_insert on storage.objects;
create policy private_voice_participant_read on storage.objects for select using (bucket_id = 'private-voice' and exists (select 1 from public.messages m join public.conversation_participants cp on cp.conversation_id = m.conversation_id where m.voice_path = name and cp.user_id = auth.uid()));
create policy private_voice_participant_insert on storage.objects for insert with check (bucket_id = 'private-voice' and auth.uid()::text = split_part(name, '/', 1) and public.is_conversation_member(split_part(name, '/', 2)::uuid));
