-- Runs the notify-expiring function every morning. Run in Supabase → SQL Editor
-- after deploying the function. Replace YOUR-PROJECT-REF and YOUR-CRON-SECRET first.
-- The schedule is in UTC: '0 7 * * *' = 08:00 in winter / 09:00 in summer (Italy).

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'grocery-notify-expiring',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/notify-expiring',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'YOUR-CRON-SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To change the time later:   select cron.unschedule('grocery-notify-expiring');  then run this file again.
