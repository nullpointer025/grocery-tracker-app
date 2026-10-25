"use strict";

const { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } = window.APP_CONFIG;
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCATIONS = [
  { id: "frigo", label: "Frigo" },
  { id: "freezer", label: "Freezer" },
  { id: "sopra_freezer", label: "Sopra il freezer" },
  { id: "dispensa", label: "Dispensa" },
];
const LOCATION_LABEL = Object.fromEntries(LOCATIONS.map((l) => [l.id, l.label]));
const CURRENT_HOUSEHOLD_KEY = "grocery.currentHousehold";

const $ = (sel) => document.querySelector(sel);
const state = {
  user: null,
  households: [],
  household: null,
  products: [],
  filter: "all",
  search: "",
  editingId: null,
  channel: null,
};

// ---------- dates & expiry status ----------

function daysUntil(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
}

// Same buckets as the spreadsheet: dark red = expired, red = within 7 days, orange = within 14.
function expiryStatus(p) {
  if (!p.expires_on) return "none";
  const days = daysUntil(p.expires_on);
  if (days < 0) return "expired";
  if (days <= 7) return "soon";
  if (days <= 14) return "warn";
  return "ok";
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function relativeDays(days) {
  if (days < -1) return `scaduto da ${-days} giorni`;
  if (days === -1) return "scaduto ieri";
  if (days === 0) return "scade oggi";
  if (days === 1) return "scade domani";
  return `tra ${days} giorni`;
}

// Dated products first (nearest first), then products without a date.
function compareProducts(a, b) {
  if (a.expires_on && b.expires_on) {
    return a.expires_on.localeCompare(b.expires_on) || a.name.localeCompare(b.name, "it");
  }
  if (a.expires_on) return -1;
  if (b.expires_on) return 1;
  return a.name.localeCompare(b.name, "it");
}

// ---------- rendering ----------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function render() {
  const query = state.search.trim().toLowerCase();
  const visible = state.products
    .filter((p) => state.filter === "all" || p.location === state.filter)
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .sort(compareProducts);

  $("#app-title").textContent = state.household ? state.household.name : "Grocery Tracker";
  $("#list").replaceChildren(...visible.map(renderItem));
  $("#empty").hidden = visible.length > 0;
  renderFilters();
  renderSummary();
}

function renderItem(p) {
  const li = el("li", `item status-${expiryStatus(p)}`);
  const btn = el("button", "item-btn");
  btn.type = "button";
  btn.addEventListener("click", () => openProduct(p));

  const main = el("span", "item-main");
  main.append(el("span", "item-name", p.name));
  const meta = [LOCATION_LABEL[p.location], p.quantity].filter(Boolean).join(" · ");
  main.append(el("span", "item-meta", meta));

  const side = el("span", "item-side");
  if (p.expires_on) {
    side.append(el("span", "item-date", formatDate(p.expires_on)));
    side.append(el("span", "item-rel", relativeDays(daysUntil(p.expires_on))));
  }
  if (p.note) side.append(el("span", "item-note", p.note));

  btn.append(main, side);
  li.append(btn);
  return li;
}

function renderFilters() {
  const options = [{ id: "all", label: "Tutti" }, ...LOCATIONS];
  const chips = options.map((opt) => {
    const count = opt.id === "all"
      ? state.products.length
      : state.products.filter((p) => p.location === opt.id).length;
    const chip = el("button", "chip", `${opt.label} ${count}`);
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(state.filter === opt.id));
    chip.addEventListener("click", () => {
      state.filter = opt.id;
      render();
    });
    return chip;
  });
  $("#filters").replaceChildren(...chips);
}

function renderSummary() {
  const count = (status) => state.products.filter((p) => expiryStatus(p) === status).length;
  const parts = [];
  const expired = count("expired");
  const soon = count("soon");
  const warn = count("warn");
  if (expired) parts.push(`${expired} scadut${expired === 1 ? "o" : "i"}`);
  if (soon) parts.push(`${soon} entro 7 giorni`);
  if (warn) parts.push(`${warn} entro 14 giorni`);
  $("#summary").textContent = parts.join(" · ");
}

let toastTimer;
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (node.hidden = true), 3500);
}

function showView(id) {
  for (const view of document.querySelectorAll(".view")) view.hidden = view.id !== id;
}

// ---------- products ----------

async function loadProducts() {
  if (!state.household) return;
  const { data, error } = await db.from("products").select("*").eq("household_id", state.household.id);
  if (error) {
    toast(`Errore nel caricamento: ${error.message}`);
    return;
  }
  state.products = data;
  render();
}

let reloadTimer;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(loadProducts, 300);
}

// Changes made on another phone show up here without refreshing.
function subscribeToChanges() {
  unsubscribeFromChanges();
  state.channel = db
    .channel(`products-${state.household.id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products", filter: `household_id=eq.${state.household.id}` },
      scheduleReload,
    )
    .subscribe();
}

function unsubscribeFromChanges() {
  if (!state.channel) return;
  db.removeChannel(state.channel);
  state.channel = null;
}

function openProduct(p) {
  const form = $("#product-form");
  state.editingId = p ? p.id : null;
  $("#product-title").textContent = p ? "Modifica prodotto" : "Nuovo prodotto";
  form.elements.name.value = p ? p.name : "";
  form.elements.location.value = p ? p.location : (state.filter !== "all" ? state.filter : "frigo");
  form.elements.quantity.value = p ? p.quantity : "";
  form.elements.expires_on.value = p && p.expires_on ? p.expires_on : "";
  form.elements.note.value = p ? p.note : "";
  $("#delete-btn").hidden = !p;
  $("#product-dialog").showModal();
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.target;
  const row = {
    name: form.elements.name.value.trim(),
    location: form.elements.location.value,
    quantity: form.elements.quantity.value.trim(),
    expires_on: form.elements.expires_on.value || null,
    note: form.elements.note.value.trim(),
  };
  if (!row.name) return;

  $("#save-btn").disabled = true;
  const { error } = state.editingId
    ? await db.from("products").update(row).eq("id", state.editingId)
    : await db.from("products").insert({ ...row, household_id: state.household.id });
  $("#save-btn").disabled = false;

  if (error) {
    toast(`Errore nel salvataggio: ${error.message}`);
    return;
  }
  $("#product-dialog").close();
  loadProducts();
}

async function deleteProduct() {
  const name = $("#product-form").elements.name.value;
  if (!state.editingId || !confirm(`Eliminare "${name}"?`)) return;
  const { error } = await db.from("products").delete().eq("id", state.editingId);
  if (error) {
    toast(`Errore nell'eliminazione: ${error.message}`);
    return;
  }
  $("#product-dialog").close();
  loadProducts();
}

// ---------- households (invite codes) ----------

function rememberHousehold(id) {
  try {
    localStorage.setItem(CURRENT_HOUSEHOLD_KEY, id);
  } catch {
    // Private mode: the app still works, it just won't remember the choice.
  }
}

function rememberedHousehold() {
  try {
    return localStorage.getItem(CURRENT_HOUSEHOLD_KEY);
  } catch {
    return null;
  }
}

async function loadHouseholds() {
  const { data, error } = await db
    .from("household_members")
    .select("households(id, name, invite_code)")
    .eq("user_id", state.user.id)
    .order("joined_at");
  if (error) throw error;
  state.households = data.map((row) => row.households).filter(Boolean);
}

async function openHousehold(id) {
  state.household = state.households.find((h) => h.id === id) || state.households[0] || null;
  state.products = [];
  state.filter = "all";
  if (!state.household) {
    unsubscribeFromChanges();
    showJoin();
    return;
  }
  rememberHousehold(state.household.id);
  showView("app-view");
  render();
  await loadProducts();
  subscribeToChanges();
}

function showJoin() {
  $("#join-msg").textContent = "";
  $("#join-back").hidden = !state.household;
  showView("join-view");
}

function generateCode() {
  // No 0/o, 1/l/i so the code is easy to read out loud or copy by hand.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}

async function afterJoin(rpcResult) {
  const { data: householdId, error } = rpcResult;
  if (error) {
    $("#join-msg").textContent = error.message;
    return;
  }
  await loadHouseholds();
  await openHousehold(householdId);
}

async function joinHousehold(event) {
  event.preventDefault();
  $("#join-msg").textContent = "Accesso al gruppo…";
  await afterJoin(await db.rpc("join_household", { code: event.target.elements.code.value }));
}

async function createHousehold(event) {
  event.preventDefault();
  const form = event.target;
  $("#join-msg").textContent = "Creazione del gruppo…";
  await afterJoin(await db.rpc("create_household", {
    code: form.elements.code.value,
    household_name: form.elements.name.value,
  }));
}

async function shareCode() {
  const { name, invite_code: code } = state.household;
  const text = `Entra nel gruppo "${name}" su Grocery Tracker con il codice: ${code}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Grocery Tracker", text, url: location.href });
    } else {
      await navigator.clipboard.writeText(code);
      toast("Codice copiato");
    }
  } catch {
    // The user closed the share sheet.
  }
}

async function leaveHousehold() {
  const { id, name } = state.household;
  if (!confirm(`Uscire dal gruppo "${name}"? Potrai rientrare con il codice invito.`)) return;
  const { error } = await db.from("household_members").delete().eq("household_id", id).eq("user_id", state.user.id);
  if (error) {
    toast(`Errore: ${error.message}`);
    return;
  }
  $("#settings-dialog").close();
  await loadHouseholds();
  await openHousehold(null);
}

// ---------- settings ----------

function openSettings() {
  const { name, invite_code: code } = state.household;
  $("#household-name").textContent = name;
  $("#household-code").textContent = code;

  const select = $("#household-select");
  select.replaceChildren(...state.households.map((h) => {
    const option = el("option", null, h.name);
    option.value = h.id;
    option.selected = h.id === state.household.id;
    return option;
  }));
  $("#household-switch").hidden = state.households.length < 2;

  updatePushUI();
  $("#settings-dialog").showModal();
}

// ---------- push notifications ----------

const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function urlBase64ToUint8Array(base64) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function currentSubscription() {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function updatePushUI() {
  const status = $("#push-status");
  const btn = $("#push-btn");
  btn.hidden = true;

  if (!pushSupported) {
    status.textContent = isIOS && !isStandalone
      ? "Su iPhone le notifiche funzionano solo dall'app sulla schermata Home: in Safari tocca Condividi → Aggiungi alla schermata Home, poi apri l'app da lì."
      : "Questo browser non supporta le notifiche.";
    return;
  }
  if (VAPID_PUBLIC_KEY.startsWith("YOUR-")) {
    status.textContent = "Notifiche non ancora configurate (VAPID_PUBLIC_KEY in config.js).";
    return;
  }
  if (Notification.permission === "denied") {
    status.textContent = "Notifiche bloccate. Riattivale in Impostazioni → Notifiche → Grocery.";
    return;
  }

  const sub = await currentSubscription();
  status.textContent = sub
    ? "Attive su questo dispositivo. Ricevi un avviso ogni mattina per i prodotti in scadenza."
    : "Ricevi un avviso ogni mattina per i prodotti che scadono entro 3 giorni.";
  btn.textContent = sub ? "Disattiva notifiche" : "Attiva notifiche";
  btn.hidden = false;
}

async function togglePush() {
  const btn = $("#push-btn");
  btn.disabled = true;
  try {
    const existing = await currentSubscription();
    if (existing) {
      await db.from("push_subscriptions").delete().eq("endpoint", existing.endpoint);
      await existing.unsubscribe();
      toast("Notifiche disattivate");
    } else {
      // iOS requires the permission prompt to come straight from the tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const { keys } = sub.toJSON();
      const { error } = await db
        .from("push_subscriptions")
        .upsert({ endpoint: sub.endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });
      if (error) {
        await sub.unsubscribe();
        throw error;
      }
      toast("Notifiche attivate");
    }
  } catch (err) {
    toast(`Errore notifiche: ${err.message}`);
  } finally {
    btn.disabled = false;
    updatePushUI();
  }
}

// ---------- startup ----------

function wireUp() {
  const select = $("#product-form").elements.location;
  select.replaceChildren(...LOCATIONS.map((l) => {
    const option = el("option", null, l.label);
    option.value = l.id;
    return option;
  }));

  $("#join-form").addEventListener("submit", joinHousehold);
  $("#create-form").addEventListener("submit", createHousehold);
  $("#generate-code").addEventListener("click", () => {
    $("#create-form").elements.code.value = generateCode();
  });
  $("#join-back").addEventListener("click", () => showView("app-view"));

  $("#search").addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });
  $("#add-btn").addEventListener("click", () => openProduct(null));
  $("#product-form").addEventListener("submit", saveProduct);
  $("#cancel-btn").addEventListener("click", () => $("#product-dialog").close());
  $("#delete-btn").addEventListener("click", deleteProduct);

  $("#settings-btn").addEventListener("click", openSettings);
  $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
  $("#household-select").addEventListener("change", (e) => {
    $("#settings-dialog").close();
    openHousehold(e.target.value);
  });
  $("#share-code").addEventListener("click", shareCode);
  $("#other-household").addEventListener("click", () => {
    $("#settings-dialog").close();
    showJoin();
  });
  $("#leave-btn").addEventListener("click", leaveHousehold);
  $("#push-btn").addEventListener("click", togglePush);

  // iOS pauses the realtime connection while the app is in the background.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.household) loadProducts();
  });
}

async function start() {
  wireUp();

  if (SUPABASE_URL.includes("YOUR-PROJECT-REF")) {
    $("#loading-msg").textContent = "Configura SUPABASE_URL e SUPABASE_ANON_KEY in config.js (vedi README).";
    return;
  }

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

  try {
    // Each phone gets its own anonymous account the first time; the session is kept after that.
    let { data: { session } } = await db.auth.getSession();
    if (!session) {
      const { data, error } = await db.auth.signInAnonymously();
      if (error) throw error;
      session = data.session;
    }
    state.user = session.user;
    await loadHouseholds();
    await openHousehold(rememberedHousehold());
  } catch (err) {
    $("#loading-msg").textContent = `Errore di connessione: ${err.message}`;
    showView("loading-view");
  }
}

start();
