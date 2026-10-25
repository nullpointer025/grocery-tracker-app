-- Grocery Tracker database. Run once in Supabase → SQL Editor.
-- Each phone signs in anonymously. People join a household with its invite code,
-- and everyone in a household shares the same product list.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Casa' check (length(trim(name)) > 0),
  invite_code text not null unique
    check (invite_code = lower(trim(invite_code)) and length(invite_code) >= 6),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index household_members_user_idx on public.household_members (user_id);

create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid and user_id = auth.uid()
  );
$$;

-- Creates a household with the invite code the user picked and joins it.
create or replace function public.create_household(code text, household_name text default 'Casa')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(code));
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Non autenticato';
  end if;
  if length(normalized) < 6 then
    raise exception 'Il codice deve avere almeno 6 caratteri';
  end if;
  if exists (select 1 from public.households where invite_code = normalized) then
    raise exception 'Codice già in uso, scegline un altro';
  end if;

  insert into public.households (name, invite_code, created_by)
  values (coalesce(nullif(trim(household_name), ''), 'Casa'), normalized, auth.uid())
  returning id into new_id;
  insert into public.household_members (household_id, user_id) values (new_id, auth.uid());
  return new_id;
end;
$$;

-- Joins the household that has this invite code.
create or replace function public.join_household(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if auth.uid() is null then
    raise exception 'Non autenticato';
  end if;
  select id into hid from public.households where invite_code = lower(trim(code));
  if hid is null then
    raise exception 'Codice non valido';
  end if;
  insert into public.household_members (household_id, user_id)
  values (hid, auth.uid())
  on conflict do nothing;
  return hid;
end;
$$;

revoke all on function public.is_household_member(uuid) from public, anon;
revoke all on function public.create_household(text, text) from public, anon;
revoke all on function public.join_household(text) from public, anon;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

alter table public.households enable row level security;
create policy "members see their household" on public.households
  for select to authenticated using (public.is_household_member(id));
create policy "members rename their household" on public.households
  for update to authenticated
  using (public.is_household_member(id))
  with check (public.is_household_member(id));

alter table public.household_members enable row level security;
create policy "members see each other" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));
create policy "members can leave" on public.household_members
  for delete to authenticated using (user_id = auth.uid());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  location text not null check (location in ('frigo', 'freezer', 'sopra_freezer', 'dispensa')),
  quantity text not null default '',
  expires_on date,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index products_household_expires_idx on public.products (household_id, expires_on);

create or replace function public.touch_product()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_product();

alter table public.products enable row level security;
create policy "members read products" on public.products
  for select to authenticated using (public.is_household_member(household_id));
create policy "members add products" on public.products
  for insert to authenticated with check (public.is_household_member(household_id));
create policy "members edit products" on public.products
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "members delete products" on public.products
  for delete to authenticated using (public.is_household_member(household_id));

-- Live updates between phones.
alter publication supabase_realtime add table public.products;

-- One row per phone that turned on notifications.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
