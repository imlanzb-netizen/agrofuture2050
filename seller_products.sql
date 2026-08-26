create table if not exists public.seller_products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric not null,
  quantity numeric not null default 0,
  location text not null,
  phone text not null,
  description text,
  image_url text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table public.seller_products enable row level security;

drop policy if exists "Anyone can view active seller products"
on public.seller_products;

create policy "Anyone can view active seller products"
on public.seller_products
for select
using (status = 'active' or auth.uid() = seller_id);

drop policy if exists "Sellers can create their own products"
on public.seller_products;

create policy "Sellers can create their own products"
on public.seller_products
for insert
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their own products"
on public.seller_products;

create policy "Sellers can update their own products"
on public.seller_products
for update
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete their own products"
on public.seller_products;

create policy "Sellers can delete their own products"
on public.seller_products
for delete
using (auth.uid() = seller_id);
