-- Each phone's notification is written in the language that phone's app uses (Italiano / English).
-- The app saves it when notifications are turned on and whenever the language changes.
-- Run once in Supabase -> SQL Editor (after 004_shopping_list.sql).

alter table public.push_subscriptions add column if not exists lang text not null default 'it';
alter table public.push_subscriptions drop constraint if exists push_subscriptions_lang_check;
alter table public.push_subscriptions add constraint push_subscriptions_lang_check check (lang in ('it', 'en'));
