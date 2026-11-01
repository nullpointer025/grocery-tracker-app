-- "Lista spesa" and "Nuovi" tabs. Each product has a stage:
--   stock    = at home (the normal list, default for every existing product)
--   shopping = in the shopping list (just a name)
--   new      = bought and ticked off, waiting for its details (expiry etc.) in "Nuovi"
-- Run once in Supabase -> SQL Editor (after 003_extend_expiry.sql).

alter table public.products add column if not exists stage text not null default 'stock';
alter table public.products drop constraint if exists products_stage_check;
alter table public.products add constraint products_stage_check check (stage in ('stock', 'shopping', 'new'));
