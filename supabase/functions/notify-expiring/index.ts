// Daily job: for each household, sends one push notification to its members'
// phones listing products that are expired or expire within WARN_DAYS days.
// Called by pg_cron (see supabase/cron.sql) with the x-cron-secret header.
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
import webpush from "npm:web-push@3.6.7";

const WARN_DAYS = 3;
const TIME_ZONE = "Europe/Rome";

function todayInTimeZone(): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return json({ error: "forbidden" }, 403);
  }

  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const today = todayInTimeZone();
  const { data: products, error } = await db
    .from("products")
    .select("household_id, name, expires_on")
    .not("expires_on", "is", null)
    .lte("expires_on", addDays(today, WARN_DAYS))
    .order("expires_on");
  if (error) return json({ error: error.message }, 500);
  if (!products.length) return json({ sent: 0, reason: "nothing expiring" });

  const byHousehold = Map.groupBy(products, (p) => p.household_id);
  const { data: members, error: membersError } = await db
    .from("household_members")
    .select("household_id, user_id")
    .in("household_id", [...byHousehold.keys()]);
  if (membersError) return json({ error: membersError.message }, 500);

  const { data: subs, error: subsError } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, user_id")
    .in("user_id", [...new Set(members.map((m) => m.user_id))]);
  if (subsError) return json({ error: subsError.message }, 500);

  let sent = 0;
  let removed = 0;
  for (const [householdId, items] of byHousehold) {
    const userIds = new Set(members.filter((m) => m.household_id === householdId).map((m) => m.user_id));
    const payload = buildPayload(items, today);
    for (const sub of subs.filter((s) => userIds.has(s.user_id))) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent++;
      } catch (err) {
        // 404/410: the phone removed the app or turned notifications off.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          removed++;
        } else {
          console.error("push failed", status, err);
        }
      }
    }
  }

  return json({ sent, removed, households: byHousehold.size, products: products.length });
});

function buildPayload(items: { name: string; expires_on: string }[], today: string): string {
  const expired = items.filter((p) => p.expires_on < today);
  const dueToday = items.filter((p) => p.expires_on === today);
  const dueSoon = items.filter((p) => p.expires_on > today);

  const lines: string[] = [];
  if (dueToday.length) lines.push(`Scade oggi: ${dueToday.map((p) => p.name).join(", ")}`);
  if (dueSoon.length) {
    lines.push(`Entro ${WARN_DAYS} giorni: ${dueSoon.map((p) => `${p.name} (${shortDate(p.expires_on)})`).join(", ")}`);
  }
  if (expired.length) lines.push(`Già scaduti: ${expired.map((p) => p.name).join(", ")}`);

  const upcoming = dueToday.length + dueSoon.length;
  const title = upcoming
    ? `🛒 ${upcoming} prodott${upcoming === 1 ? "o" : "i"} in scadenza`
    : `🛒 ${expired.length} prodott${expired.length === 1 ? "o scaduto" : "i scaduti"}`;
  return JSON.stringify({ title, body: lines.join("\n"), url: "./" });
}
