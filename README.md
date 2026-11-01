# Grocery Tracker

A small web app (PWA) that does what the DISPENSA spreadsheet does: it lists everything you keep
at home, grouped by categories you create yourself (for example Frigo, Freezer, Dispensa), sorted
by expiry date, with the same colors:

| Color | Meaning |
|---|---|
| Dark red | already expired |
| Red | expires within 7 days |
| Orange | expires within 14 days |

Products without a date (or with only a note such as "il prima possibile") go at the bottom.
Changes show up live on every phone, and each phone can get a notification every morning for
products that expire within 3 days.

**No accounts or passwords.** The first time the app opens, it gets an anonymous Supabase
login that stays on that phone. Then you either:

- **create a group** (for example "Casa") and pick its invite code yourself, or tap *Genera*, or
- **join a group** by typing an invite code someone shared with you.

Everyone who enters the same code shares the same list. The code is the only key to the group, so
pick something that's hard to guess (at least 6 characters; *Genera* makes one like `k7pq-x3mz`).
You can share it from ⚙︎ → *Condividi codice*. If a phone loses its data, it can rejoin with the code.

- **App**: plain HTML/CSS/JS, no build step (`index.html`, `app.js`, `styles.css`, `sw.js`)
- **Database + login + daily job**: [Supabase](https://supabase.com) (free plan)
- **Hosting**: GitHub Pages (free, HTTPS)

## Setup

### 1. Create the database

1. Create a free account at supabase.com and a new project (region: Europe).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
3. **Authentication → Sign In / Providers**: turn on **Allow anonymous sign-ins** and save.

### 2. Connect the app

In **Project Settings → API Keys**, copy the **publishable key**, and put it and the project URL
into `config.js`. These are meant to be public; the access rules in `schema.sql` protect the data.

### 3. Notifications (optional, can be done later)

1. Generate a key pair (any PC with Node.js):
   ```
   npx web-push generate-vapid-keys
   ```
   Put the **public** key into `VAPID_PUBLIC_KEY` in `config.js`.
2. **Edge Functions → Secrets**: add
   - `VAPID_PUBLIC_KEY` – the public key
   - `VAPID_PRIVATE_KEY` – the private key (keep it secret, never put it in `config.js`)
   - `VAPID_SUBJECT` – `mailto:` followed by your email
   - `CRON_SECRET` – any long random string
3. **Edge Functions → Deploy a new function → Via Editor**: name it `notify-expiring`, paste
   `supabase/functions/notify-expiring/index.ts`, deploy. In the function's settings turn **off**
   "Verify JWT" (the function checks `CRON_SECRET` instead).
4. In **SQL Editor**, run `supabase/cron.sql` after replacing `YOUR-PROJECT-REF` and
   `YOUR-CRON-SECRET`. It sends the notification every morning at 08:00 (09:00 in summer).

### 4. Put it online with GitHub Pages

1. Create a new GitHub repository (for example `grocery-tracker-app`) and push this folder.
2. **Settings → Pages → Build and deployment**: Source "Deploy from a branch", branch `main`, folder `/ (root)`.
3. After a minute the app is at `https://<your-username>.github.io/grocery-tracker-app/`.

### 5. Install on the iPhone

1. Open the address in **Safari**.
2. Tap **Share → Add to Home Screen**, then open the app from the new icon.
3. Create your group (or join one with its invite code).
4. Tap ⚙︎ → **Attiva notifiche** and allow notifications. (iOS 16.4 or newer; notifications only
   work from the home-screen app, not from a Safari tab.)

Repeat on each phone, joining with the same invite code.

## Updating the app

After changing any app file, bump `CACHE` in `sw.js` (for example `grocery-tracker-v2`) and push.
Phones pick up the new version the next time the app is opened.

### Database updates

If your database was created with an older `schema.sql`, run the files in `supabase/migrations/`
that you haven't run yet, in order, in **SQL Editor** — before pushing the app version that needs them.

- `002_custom_locations.sql` – categories are created by each group instead of the fixed
  Frigo / Freezer / Sopra il freezer / Dispensa. Existing groups keep the ones they already use.
- `003_extend_expiry.sql` – the "+5m" checkbox on each product (moves the expiry 5 months later;
  unticking restores the original date).
- `004_shopping_list.sql` – the "Lista spesa" and "Nuovi" tabs (adds a `stage` to each product;
  existing products stay in the normal list).

## Trying it on the PC

```
python -m http.server 8000
```
then open http://localhost:8000. Groups and the list work there; notifications need the HTTPS
address and the iPhone home-screen app.
