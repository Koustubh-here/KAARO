-- Schema for KAROO
-- Run this in Supabase SQL editor

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

-- Ensure one business per owner
create unique index if not exists businesses_owner_unique on public.businesses(owner_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  stock integer not null default 0,
  image text,
  created_at timestamp with time zone default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  description text not null,
  category text,
  amount numeric not null,
  date date not null default now(),
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;

-- Policies: users can read/write only their own business data
create policy if not exists "own_business_read" on public.businesses
for select using ( auth.uid() = owner_id );

create policy if not exists "own_business_write" on public.businesses
for insert with check ( auth.uid() = owner_id );

create policy if not exists "products_read" on public.products
for select using (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "products_write" on public.products
for insert with check (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "products_update" on public.products
for update using (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "products_delete" on public.products
for delete using (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "transactions_read" on public.transactions
for select using (
  exists (
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "transactions_write" on public.transactions
for insert with check (
  exists (
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_id = auth.uid()
  )
);

create policy if not exists "transactions_delete" on public.transactions
for delete using (
  exists (
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_id = auth.uid()
  )
);


