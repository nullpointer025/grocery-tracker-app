-- "+5m" checkbox on each product: ticking it moves the expiry date 5 months later and keeps the
-- original date here, so unticking puts back exactly that date. Null = not extended.
-- Run once in Supabase -> SQL Editor (after 002_custom_locations.sql).

alter table public.products add column if not exists extended_from date;
