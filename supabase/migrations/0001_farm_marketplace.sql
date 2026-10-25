-- Abuzuriaz Cattle Farm: additive PostgreSQL schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farm_settings (
  id text primary key default 'public',
  farm_name text,
  tagline text,
  phone text,
  whatsapp text,
  location text,
  about_text text,
  contact_email text,
  delivery_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.cattle (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  title text not null,
  category text not null check (category in ('Cows','Buffaloes','Goats','Sheep','Calves','Bulls','Other livestock')),
  breed text,
  age_months integer check (age_months is null or age_months >= 0),
  gender text check (gender is null or gender in ('Female','Male','Unknown')),
  health_details text,
  weight_kg numeric(10,2) check (weight_kg is null or weight_kg > 0),
  milk_yield_liters numeric(10,2) check (milk_yield_liters is null or milk_yield_liters >= 0),
  price_pkr numeric(14,2) check (price_pkr is null or price_pkr >= 0),
  status text not null default 'available' check (status in ('available','reserved','sold')),
  description text,
  location text,
  cover_image_url text,
  is_farm_owned boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cattle_status_category_idx on public.cattle(status, category);
create index if not exists cattle_owner_idx on public.cattle(owner_id);

create table if not exists public.milk_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  milk_type text not null,
  price_per_liter numeric(12,2) not null check (price_per_liter >= 0),
  unit text not null default 'liter',
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.milk_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.milk_products(id) on delete cascade,
  inventory_date date not null default current_date,
  produced_liters numeric(12,2) not null default 0 check (produced_liters >= 0),
  available_liters numeric(12,2) not null default 0 check (available_liters >= 0),
  updated_at timestamptz not null default now(),
  unique(product_id, inventory_date)
);
create index if not exists milk_inventory_date_idx on public.milk_inventory(inventory_date);

create table if not exists public.delivery_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  address_line text not null,
  contact_number text not null,
  created_at timestamptz not null default now()
);
create index if not exists delivery_addresses_user_idx on public.delivery_addresses(user_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  delivery_date date not null,
  time_slot text not null,
  address text not null,
  contact_number text not null,
  recurring boolean not null default false,
  payment_method text not null default 'cash_on_delivery' check (payment_method in ('cash_on_delivery','online_pending','paid','refunded')),
  payment_reference text,
  total_pkr numeric(14,2) not null default 0 check (total_pkr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.milk_products(id),
  quantity_liters numeric(12,2) not null check (quantity_liters > 0),
  unit_price_pkr numeric(12,2) not null check (unit_price_pkr >= 0),
  line_total_pkr numeric(14,2) generated always as (quantity_liters * unit_price_pkr) stored
);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.marketplace_posts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  description text not null,
  asking_price_pkr numeric(14,2) check (asking_price_pkr is null or asking_price_pkr >= 0),
  location text,
  contact_details text,
  seller_label text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','sold','archived')),
  is_farm_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketplace_status_created_idx on public.marketplace_posts(status, created_at desc);
create index if not exists marketplace_seller_idx on public.marketplace_posts(seller_id);

create table if not exists public.marketplace_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.marketplace_posts(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image','video')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists marketplace_media_post_idx on public.marketplace_media(post_id, sort_order);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.marketplace_posts(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;

create or replace function public.place_milk_order(
  p_user_id uuid, p_product_id uuid, p_quantity_liters numeric, p_delivery_date date,
  p_time_slot text, p_address text, p_contact_number text, p_recurring boolean default false
) returns uuid language plpgsql security definer set search_path = public
as $$
declare v_inventory public.milk_inventory%rowtype; v_price numeric; v_order_id uuid;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then raise exception 'Not authorized'; end if;
  if p_quantity_liters <= 0 then raise exception 'Quantity must be positive'; end if;
  select * into v_inventory from public.milk_inventory where product_id = p_product_id and inventory_date = current_date for update;
  if not found or v_inventory.available_liters < p_quantity_liters then raise exception 'Not enough milk inventory'; end if;
  select price_per_liter into v_price from public.milk_products where id = p_product_id and is_active = true;
  if v_price is null then raise exception 'Milk product is unavailable'; end if;
  insert into public.orders(user_id, delivery_date, time_slot, address, contact_number, recurring, total_pkr)
    values(p_user_id, p_delivery_date, p_time_slot, p_address, p_contact_number, coalesce(p_recurring,false), p_quantity_liters * v_price) returning id into v_order_id;
  insert into public.order_items(order_id, product_id, quantity_liters, unit_price_pkr) values(v_order_id, p_product_id, p_quantity_liters, v_price);
  insert into public.delivery_addresses(user_id, address_line, contact_number) values(p_user_id, p_address, p_contact_number);
  update public.milk_inventory set available_liters = available_liters - p_quantity_liters, updated_at = now() where id = v_inventory.id;
  insert into public.notifications(user_id, kind, title, body) values(p_user_id, 'order_created', 'Milk order received', 'Your order is waiting for farm confirmation.');
  return v_order_id;
end; $$;

grant execute on function public.place_milk_order(uuid,uuid,numeric,date,text,text,text,boolean) to authenticated;

alter table public.profiles enable row level security;
alter table public.farm_settings enable row level security;
alter table public.cattle enable row level security;
alter table public.milk_products enable row level security;
alter table public.milk_inventory enable row level security;
alter table public.delivery_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.marketplace_posts enable row level security;
alter table public.marketplace_media enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_self on public.profiles;
drop policy if exists farm_settings_public_read on public.farm_settings;
drop policy if exists farm_settings_admin_write on public.farm_settings;
drop policy if exists cattle_public_read on public.cattle;
drop policy if exists cattle_admin_write on public.cattle;
drop policy if exists milk_products_public_read on public.milk_products;
drop policy if exists milk_products_admin_write on public.milk_products;
drop policy if exists milk_inventory_public_read on public.milk_inventory;
drop policy if exists milk_inventory_admin_write on public.milk_inventory;
drop policy if exists addresses_owner on public.delivery_addresses;
drop policy if exists orders_owner_read on public.orders;
drop policy if exists orders_admin_update on public.orders;
drop policy if exists items_owner_read on public.order_items;
drop policy if exists marketplace_public_read on public.marketplace_posts;
drop policy if exists marketplace_owner_insert on public.marketplace_posts;
drop policy if exists marketplace_owner_update on public.marketplace_posts;
drop policy if exists marketplace_owner_delete on public.marketplace_posts;
drop policy if exists marketplace_media_public_read on public.marketplace_media;
drop policy if exists marketplace_media_owner_write on public.marketplace_media;
drop policy if exists notifications_owner on public.notifications;
drop policy if exists notifications_mark_read on public.notifications;
drop policy if exists reports_owner_insert on public.reports;
drop policy if exists reports_owner_read on public.reports;

do $$ begin
  create policy profiles_self on public.profiles for all using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
  create policy farm_settings_public_read on public.farm_settings for select using (id = 'public');
  create policy farm_settings_admin_write on public.farm_settings for all using (public.is_admin()) with check (public.is_admin());
  create policy cattle_public_read on public.cattle for select using (approved = true and status <> 'sold');
  create policy cattle_admin_write on public.cattle for all using (public.is_admin()) with check (public.is_admin());
  create policy milk_products_public_read on public.milk_products for select using (is_active = true);
  create policy milk_products_admin_write on public.milk_products for all using (public.is_admin()) with check (public.is_admin());
  create policy milk_inventory_public_read on public.milk_inventory for select using (inventory_date = current_date);
  create policy milk_inventory_admin_write on public.milk_inventory for all using (public.is_admin()) with check (public.is_admin());
  create policy addresses_owner on public.delivery_addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy orders_owner_read on public.orders for select using (user_id = auth.uid() or public.is_admin());
  create policy orders_admin_update on public.orders for update using (public.is_admin()) with check (public.is_admin());
  create policy items_owner_read on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
  create policy marketplace_public_read on public.marketplace_posts for select using (status = 'approved');
  create policy marketplace_owner_insert on public.marketplace_posts for insert with check (seller_id = auth.uid() and is_farm_verified = false and status = 'pending');
  create policy marketplace_owner_update on public.marketplace_posts for update using (seller_id = auth.uid() or public.is_admin()) with check ((seller_id = auth.uid() and is_farm_verified = false) or public.is_admin());
  create policy marketplace_owner_delete on public.marketplace_posts for delete using (seller_id = auth.uid() or public.is_admin());
  create policy marketplace_media_public_read on public.marketplace_media for select using (exists (select 1 from public.marketplace_posts p where p.id = post_id and p.status = 'approved'));
  create policy marketplace_media_owner_write on public.marketplace_media for all using (exists (select 1 from public.marketplace_posts p where p.id = post_id and (p.seller_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.marketplace_posts p where p.id = post_id and (p.seller_id = auth.uid() or public.is_admin())));
  create policy notifications_owner on public.notifications for select using (user_id = auth.uid());
  create policy notifications_mark_read on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
  create policy reports_owner_insert on public.reports for insert with check (reporter_id = auth.uid());
  create policy reports_owner_read on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;

insert into public.farm_settings(id) values ('public') on conflict (id) do nothing;

insert into storage.buckets(id, name, public) values
  ('livestock-media','livestock-media',false), ('marketplace-media','marketplace-media',false), ('farm-gallery','farm-gallery',false)
on conflict (id) do nothing;

drop policy if exists livestock_public_read on storage.objects;
drop policy if exists livestock_admin_write on storage.objects;
drop policy if exists marketplace_media_public_read on storage.objects;
drop policy if exists marketplace_media_owner_read on storage.objects;
drop policy if exists marketplace_media_owner_write on storage.objects;
drop policy if exists marketplace_media_owner_update on storage.objects;
drop policy if exists marketplace_media_owner_delete on storage.objects;
drop policy if exists farm_gallery_public_read on storage.objects;
drop policy if exists farm_gallery_admin_write on storage.objects;
create policy livestock_public_read on storage.objects for select using (bucket_id = 'livestock-media' and exists (select 1 from public.cattle c where c.id::text = split_part(name, '/', 1) and c.approved = true));
create policy livestock_admin_write on storage.objects for insert with check (bucket_id = 'livestock-media' and public.is_admin() and lower(name) ~ '\.(jpg|jpeg|png|webp|mp4|mov)$');
create policy marketplace_media_public_read on storage.objects for select using (bucket_id = 'marketplace-media' and exists (select 1 from public.marketplace_posts p where p.id::text = split_part(name, '/', 2) and p.status = 'approved'));
create policy marketplace_media_owner_read on storage.objects for select using (bucket_id = 'marketplace-media' and split_part(name, '/', 1) = auth.uid()::text);
create policy marketplace_media_owner_write on storage.objects for insert with check (bucket_id = 'marketplace-media' and auth.uid() is not null and split_part(name, '/', 1) = auth.uid()::text and lower(name) ~ '\.(jpg|jpeg|png|webp|mp4|mov)$');
create policy marketplace_media_owner_update on storage.objects for update using (bucket_id = 'marketplace-media' and split_part(name, '/', 1) = auth.uid()::text) with check (bucket_id = 'marketplace-media' and split_part(name, '/', 1) = auth.uid()::text);
create policy marketplace_media_owner_delete on storage.objects for delete using (bucket_id = 'marketplace-media' and split_part(name, '/', 1) = auth.uid()::text);
create policy farm_gallery_public_read on storage.objects for select using (bucket_id = 'farm-gallery' and public.is_admin());
create policy farm_gallery_admin_write on storage.objects for insert with check (bucket_id = 'farm-gallery' and public.is_admin() and lower(name) ~ '\.(jpg|jpeg|png|webp|mp4|mov)$');
