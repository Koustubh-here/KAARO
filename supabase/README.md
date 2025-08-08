Supabase setup for KAROO

1) In your Supabase project (KAROO), open SQL Editor and run `schema.sql` from this folder.

2) Enable RLS is already included; policies allow each user to see and modify only their own business data.

3) App flow
- On first login, the app auto-creates a row in `businesses` with `owner_id = auth.uid()`.
- Inventory uses `products` table.
- Ledger and Home use `transactions` table.

4) Optional indexes
```sql
create index if not exists products_business_idx on public.products(business_id);
create index if not exists transactions_business_idx on public.transactions(business_id, date desc);
```


