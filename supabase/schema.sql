-- Schema for KAROO
-- Run this in Supabase SQL editor

-- Align businesses with app (owner_user)
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

create unique index if not exists businesses_owner_unique on public.businesses(owner_user);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
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
for select using ( auth.uid() = owner_user );

create policy if not exists "own_business_write" on public.businesses
for insert with check ( auth.uid() = owner_user );

create policy if not exists "products_read" on public.products
for select using (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_user = auth.uid()
  )
);

create policy if not exists "products_write" on public.products
for insert with check (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_user = auth.uid()
  )
);

create policy if not exists "products_update" on public.products
for update using (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_user = auth.uid()
  )
) with check (
  exists (
    select 1 from public.businesses b where b.id = products.business_id and b.owner_user = auth.uid()
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
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_user = auth.uid()
  )
);

create policy if not exists "transactions_write" on public.transactions
for insert with check (
  exists (
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_user = auth.uid()
  )
);

create policy if not exists "transactions_delete" on public.transactions
for delete using (
  exists (
    select 1 from public.businesses b where b.id = transactions.business_id and b.owner_user = auth.uid()

-- AI memory and conversations (see migrations)
create extension if not exists vector;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  title text not null default 'default',
  created_at timestamptz default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('system','user','assistant')),
  content text not null,
  tool_name text,
  created_at timestamptz default now()
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy if not exists ai_convos_select on public.ai_conversations for select using (auth.uid() = user_id);
create policy if not exists ai_convos_insert on public.ai_conversations for insert with check (auth.uid() = user_id);
create policy if not exists ai_msgs_select on public.ai_messages for select using (
  exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = auth.uid())
);
create policy if not exists ai_msgs_insert on public.ai_messages for insert with check (
  exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.user_id = auth.uid())
);

create table if not exists public.ai_memory (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, key)
);
alter table public.ai_memory enable row level security;
create policy if not exists ai_mem_select on public.ai_memory for select using (auth.uid() = user_id);
create policy if not exists ai_mem_upsert on public.ai_memory for insert with check (auth.uid() = user_id);
create policy if not exists ai_mem_update on public.ai_memory for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists ai_mem_delete on public.ai_memory for delete using (auth.uid() = user_id);

create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  memory_text text not null,
  embedding vector(768),
  created_at timestamptz default now()
);
alter table public.user_memories enable row level security;
create policy if not exists user_memories_select on public.user_memories for select using (auth.uid() = user_id);
create policy if not exists user_memories_insert on public.user_memories for insert with check (auth.uid() = user_id);
create policy if not exists user_memories_delete on public.user_memories for delete using (auth.uid() = user_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  business_name text,
  location text,
  preferences jsonb,
  updated_at timestamptz default now()
);
alter table public.user_profiles enable row level security;
create policy if not exists user_profiles_select on public.user_profiles for select using (auth.uid() = user_id);
create policy if not exists user_profiles_upsert on public.user_profiles for insert with check (auth.uid() = user_id);
create policy if not exists user_profiles_update on public.user_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function match_user_memories(
  query_embedding vector(768),
  match_count int,
  p_user_id uuid
)
returns table(
  id uuid,
  memory_text text,
  similarity float
)
language sql stable as $$
  select id, memory_text, 1 - (embedding <=> query_embedding) as similarity
  from user_memories
  where user_id = p_user_id
  order by embedding <=> query_embedding
  limit match_count
$$;

  )
);

-- Chat metadata improvements
alter table if not exists public.ai_conversations add column if not exists updated_at timestamptz default now();
alter table if not exists public.ai_conversations add column if not exists last_message_at timestamptz;
create index if not exists ai_conversations_user_lastmsg_idx on public.ai_conversations(user_id, coalesce(last_message_at, created_at) desc);

-- Trigger to keep last_message_at fresh and auto-title first message
create or replace function public.ai_messages_after_insert()
returns trigger as $$
begin
  update public.ai_conversations
    set last_message_at = NEW.created_at,
        updated_at = now()
  where id = NEW.conversation_id;

  -- If the conversation has default title, set it from the first user message snippet
  if NEW.role = 'user' then
    update public.ai_conversations c
      set title = left(regexp_replace(NEW.content, '\s+', ' ', 'g'), 60)
    where c.id = NEW.conversation_id and c.title = 'default';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists ai_messages_after_insert on public.ai_messages;
create trigger ai_messages_after_insert
after insert on public.ai_messages
for each row execute procedure public.ai_messages_after_insert();


