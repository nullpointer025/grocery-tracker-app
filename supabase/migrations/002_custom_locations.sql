-- Categories (Frigo, Freezer, …) are no longer a fixed list: each household creates its own.
-- Run once in Supabase → SQL Editor on a database created with the previous schema.sql.
-- New installs don't need this: schema.sql already has the new layout.

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0 and length(name) <= 40),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists locations_household_name_idx
  on public.locations (household_id, lower(trim(name)));

alter table public.locations enable row level security;
create policy "members read locations" on public.locations
  for select to authenticated using (public.is_household_member(household_id));
create policy "members add locations" on public.locations
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "members edit locations" on public.locations
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "members delete locations" on public.locations
  for delete to authenticated using (public.is_household_member(household_id));

alter publication supabase_realtime add table public.locations;

-- Deleting a category keeps its products; they show up as "Senza categoria".
alter table public.products
  add column if not exists location_id uuid references public.locations (id) on delete set null;
create index if not exists products_location_idx on public.products (location_id);

-- Existing households keep the categories their products already use (and only those).
with old (code, name, position) as (
  values ('frigo', 'Frigo', 0), ('freezer', 'Freezer', 1),
         ('sopra_freezer', 'Sopra il freezer', 2), ('dispensa', 'Dispensa', 3)
)
insert into public.locations (household_id, name, position)
select distinct p.household_id, old.name, old.position
from public.products p
join old on old.code = p.location
on conflict do nothing;

with old (code, name) as (
  values ('frigo', 'Frigo'), ('freezer', 'Freezer'),
         ('sopra_freezer', 'Sopra il freezer'), ('dispensa', 'Dispensa')
)
update public.products p
set location_id = l.id
from old, public.locations l
where old.code = p.location
  and l.household_id = p.household_id
  and l.name = old.name
  and p.location_id is null;

-- The old text column stays for now (nullable, no fixed list) so phones still on the previous
-- app version keep working. Once every phone has updated, it can be dropped:
--   alter table public.products drop column location;
alter table public.products alter column location drop not null;
alter table public.products drop constraint if exists products_location_check;
