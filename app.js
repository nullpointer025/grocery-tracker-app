"use strict";

const { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } = window.APP_CONFIG;
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CURRENT_HOUSEHOLD_KEY = "grocery.currentHousehold";
const NO_LOCATION = "none"; // filter value for products without a category
const NEW_LOCATION = "__new__"; // select value that opens the "new category" field

const $ = (sel) => document.querySelector(sel);
const state = {
  user: null,
  households: [],
  household: null,
  locations: [], // the household's own categories, in display order
  products: [],
  filter: "all", // "all", NO_LOCATION or a location id
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

function locationOf(p) {
  return state.locations.find((l) => l.id === p.location_id) || null;
}

function matchesFilter(p, filter) {
  if (filter === "all") return true;
  if (filter === NO_LOCATION) return !locationOf(p);
  return p.location_id === filter;
}

function render() {
  // The selected category may have been deleted (here or on another phone).
  const filterExists = state.filter === "all" || state.filter === NO_LOCATION
    || state.locations.some((l) => l.id === state.filter);
  if (!filterExists) state.filter = "all";

  const query = state.search.trim().toLowerCase();
  const visible = state.products
    .filter((p) => matchesFilter(p, state.filter))
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
  attachGestures(btn, {
    onTap: () => openProduct(p),
    onLongPress: () => openItemMenu(p, btn.closest(".item-card") || btn),
    onSwipeDelete: () => deleteProductBySwipe(p),
  });

  const main = el("span", "item-main");
  main.append(el("span", "item-name", p.name));
  const meta = [locationOf(p)?.name, p.quantity].filter(Boolean).join(" · ");
  main.append(el("span", "item-meta", meta));

  const side = el("span", "item-side");
  if (p.expires_on) {
    side.append(el("span", "item-date", formatDate(p.expires_on)));
    side.append(el("span", "item-rel", relativeDays(daysUntil(p.expires_on))));
  }
  if (p.note) side.append(el("span", "item-note", p.note));

  // Red "Elimina" strip uncovered when the item is swiped left.
  const swipeBg = el("span", "item-swipe-bg");
  swipeBg.setAttribute("aria-hidden", "true");
  swipeBg.append(el("span", "item-swipe-label", "Elimina"));

  // The card holds the checkbox and the tappable button (a checkbox can't live inside a button)
  // and is what slides when swiping.
  const card = el("div", "item-card");
  btn.append(main, side);
  card.append(renderExtendCheck(p), btn);
  li.append(swipeBg, card);
  return li;
}

// ---------- +5 months on the expiry date ----------

const EXTEND_MONTHS = 5;

// Same day N months later; clamped to the month's last day (31/01 + 1 month = 28/02 or 29/02).
function addMonths(iso, months) {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))).toISOString().slice(0, 10);
}

function renderExtendCheck(p) {
  const label = el("label", "item-check");
  const box = el("input");
  box.type = "checkbox";
  box.checked = Boolean(p.extended_from);
  box.disabled = !p.expires_on;
  box.setAttribute("aria-label", `${p.name}: +${EXTEND_MONTHS} mesi alla scadenza`);
  box.addEventListener("change", () => toggleExtended(p, box.checked));
  label.title = p.expires_on
    ? `+${EXTEND_MONTHS} mesi alla scadenza`
    : "Imposta una scadenza per usare +5 mesi";
  label.append(box, el("span", "item-check-text", `+${EXTEND_MONTHS}m`));
  return label;
}

// Product form: the checkbox needs a date, and the hint shows the resulting expiry.
function updateExtendHint() {
  const form = $("#product-form");
  const date = form.elements.expires_on.value;
  const box = form.elements.extend;
  box.disabled = !date;
  const hint = $("#extend-hint");
  hint.hidden = !(date && box.checked);
  if (!hint.hidden) hint.textContent = `Nuova scadenza: ${formatDate(addMonths(date, EXTEND_MONTHS))}`;
}

// Checked: remember the original date and push it 5 months later. Unchecked: put it back exactly.
async function toggleExtended(p, checked) {
  if (!p.expires_on || checked === Boolean(p.extended_from)) return;
  const patch = checked
    ? { extended_from: p.expires_on, expires_on: addMonths(p.expires_on, EXTEND_MONTHS) }
    : { expires_on: p.extended_from, extended_from: null };
  const before = { expires_on: p.expires_on, extended_from: p.extended_from };
  Object.assign(p, patch);
  render();
  const { error } = await db.from("products").update(patch).eq("id", p.id);
  if (error) {
    Object.assign(p, before);
    render();
    toast(`Errore: ${error.message}`);
  }
}

// ---------- gestures: tap, long press, swipe left to delete ----------

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;
const SWIPE_DELETE_RATIO = 0.4; // release past 40% of the width to delete

// One handler per item so the three gestures never fight each other:
// - tap → onTap
// - hold still → onLongPress
// - drag left → reveal delete; release past the threshold → onSwipeDelete
function attachGestures(node, { onTap, onLongPress, onSwipeDelete }) {
  const card = () => node.closest(".item-card") || node; // what slides
  const li = () => card().parentElement;
  let timer = null;
  let startX = 0;
  let startY = 0;
  let pointerId = null;
  let swiping = false;
  let offset = 0;
  let suppressClick = false;

  const cancelTimer = () => {
    clearTimeout(timer);
    timer = null;
  };
  const fireLongPress = () => {
    cancelTimer();
    suppressClick = true;
    if (navigator.vibrate) navigator.vibrate(10);
    onLongPress();
  };
  const setOffset = (x, animate) => {
    offset = x;
    const target = card();
    target.style.transition = animate ? "transform 0.2s ease" : "none";
    target.style.transform = x ? `translateX(${x}px)` : "";
    const armed = -x > target.offsetWidth * SWIPE_DELETE_RATIO;
    li()?.classList.toggle("is-swiping", x < 0);
    li()?.classList.toggle("is-armed", armed);
  };
  const endSwipe = () => {
    if (!swiping) return;
    swiping = false;
    suppressClick = true;
    const width = card().offsetWidth;
    if (-offset > width * SWIPE_DELETE_RATIO) {
      if (navigator.vibrate) navigator.vibrate(15);
      setOffset(-width - 20, true);
      // transitionend can be skipped (tab in background, reduced motion), so also use a timeout.
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onSwipeDelete();
      };
      card().addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 250);
    } else {
      setOffset(0, true);
    }
  };

  node.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    suppressClick = false;
    swiping = false;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    cancelTimer();
    timer = setTimeout(fireLongPress, LONG_PRESS_MS);
  });

  node.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!swiping) {
      if (Math.hypot(dx, dy) <= MOVE_TOLERANCE) return;
      cancelTimer();
      // Mostly horizontal and to the left: it's a swipe. Otherwise let the page scroll.
      if (dx < 0 && Math.abs(dx) > Math.abs(dy) && !suppressClick) {
        swiping = true;
        closeItemMenu();
        node.setPointerCapture(e.pointerId);
      } else {
        return;
      }
    }
    setOffset(Math.min(0, dx), false);
  });

  node.addEventListener("pointerup", () => {
    cancelTimer();
    pointerId = null;
    endSwipe();
  });
  node.addEventListener("pointercancel", () => {
    cancelTimer();
    pointerId = null;
    if (swiping) {
      swiping = false;
      setOffset(0, true);
    }
  });
  node.addEventListener("pointerleave", () => {
    if (!swiping) cancelTimer();
  });

  // Android long press and desktop right click: show our menu instead of the browser's.
  node.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (!suppressClick && !swiping) fireLongPress();
  });
  node.addEventListener("click", () => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    onTap();
  });
}

// Actions shown when holding an item. Add new entries here.
const ITEM_ACTIONS = [
  { label: "Duplica", run: (p) => openProduct(p, { duplicate: true }) },
];

function openItemMenu(p, anchor) {
  const menu = $("#item-menu");
  menu.replaceChildren(...ITEM_ACTIONS.map((action) => {
    const btn = el("button", "item-menu-btn", action.label);
    btn.type = "button";
    btn.setAttribute("role", "menuitem");
    btn.addEventListener("click", () => {
      closeItemMenu();
      action.run(p);
    });
    return btn;
  }));

  document.querySelectorAll(".item-card.is-held").forEach((n) => n.classList.remove("is-held"));
  anchor.classList.add("is-held");
  menu.hidden = false;

  // Below the item like the iOS menu; above it when there is no room at the bottom.
  const margin = 8;
  const rect = anchor.getBoundingClientRect();
  const { offsetWidth: w, offsetHeight: h } = menu;
  let top = rect.bottom - 6;
  if (top + h > window.innerHeight - margin) top = Math.max(margin, rect.top - h + 6);
  const left = Math.min(Math.max(margin, rect.left + 8), window.innerWidth - w - margin);
  menu.style.top = `${top}px`;
  menu.style.left = `${left}px`;
}

function closeItemMenu() {
  const menu = $("#item-menu");
  if (menu.hidden) return;
  menu.hidden = true;
  document.querySelectorAll(".item-card.is-held").forEach((n) => n.classList.remove("is-held"));
}

function renderFilters() {
  const count = (id) => state.products.filter((p) => matchesFilter(p, id)).length;
  const options = [
    { id: "all", label: "Tutti" },
    ...state.locations.map((l) => ({ id: l.id, label: l.name })),
  ];
  // Only show "Senza categoria" when something is actually in it.
  if (count(NO_LOCATION) > 0) options.push({ id: NO_LOCATION, label: "Senza categoria" });

  const chips = options.map((opt) => {
    const chip = el("button", "chip", `${opt.label} ${count(opt.id)}`);
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(state.filter === opt.id));
    chip.addEventListener("click", () => {
      state.filter = opt.id;
      render();
    });
    return chip;
  });

  const add = el("button", "chip chip-add", state.locations.length ? "+" : "+ Categoria");
  add.type = "button";
  add.setAttribute("aria-label", "Gestisci categorie");
  add.addEventListener("click", openLocations);
  $("#filters").replaceChildren(...chips, add);
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
// Optional action renders a button inside the toast, e.g. { label: "Annulla", run }.
function toast(message, action) {
  const node = $("#toast");
  node.replaceChildren(el("span", null, message));
  if (action) {
    const btn = el("button", "toast-action", action.label);
    btn.type = "button";
    btn.addEventListener("click", () => {
      node.hidden = true;
      action.run();
    });
    node.append(btn);
  }
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (node.hidden = true), action ? 6000 : 3500);
}

function showView(id) {
  for (const view of document.querySelectorAll(".view")) view.hidden = view.id !== id;
}

// ---------- products ----------

// Loads the household's categories and products together, so they always match.
async function loadData() {
  if (!state.household) return;
  const householdId = state.household.id;
  const [locations, products] = await Promise.all([
    db.from("locations").select("*").eq("household_id", householdId)
      .order("position").order("created_at"),
    db.from("products").select("*").eq("household_id", householdId),
  ]);
  const error = locations.error || products.error;
  if (error) {
    toast(`Errore nel caricamento: ${error.message}`);
    return;
  }
  if (state.household?.id !== householdId) return; // switched group meanwhile
  state.locations = locations.data;
  state.products = products.data;
  render();
  if ($("#locations-dialog").open && !isUserBusy()) renderLocations();
}

// A redraw would drop an item mid-swipe or overwrite a category name being typed.
function isUserBusy() {
  return Boolean(document.querySelector(".item.is-swiping"))
    || Boolean(document.activeElement?.matches?.("#locations-list input"));
}

let reloadTimer;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => (isUserBusy() ? scheduleReload() : loadData()), 300);
}

// Changes made on another phone show up here without refreshing.
function subscribeToChanges() {
  unsubscribeFromChanges();
  const filter = `household_id=eq.${state.household.id}`;
  let channel = db.channel(`household-${state.household.id}`);
  for (const table of ["products", "locations"]) {
    channel = channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table, filter }, scheduleReload)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table, filter }, scheduleReload)
      // Supabase can't filter DELETE events (they only carry the id), so listen to all of them;
      // the reload only fetches this household's rows anyway.
      .on("postgres_changes", { event: "DELETE", schema: "public", table }, scheduleReload);
  }
  state.channel = channel.subscribe();
}

function unsubscribeFromChanges() {
  if (!state.channel) return;
  db.removeChannel(state.channel);
  state.channel = null;
}

// With { duplicate: true } the form is prefilled from p but saving inserts a new product.
function openProduct(p, { duplicate = false } = {}) {
  const form = $("#product-form");
  state.editingId = p && !duplicate ? p.id : null;
  $("#product-title").textContent = duplicate ? "Duplica prodotto" : p ? "Modifica prodotto" : "Nuovo prodotto";
  form.elements.name.value = p ? p.name : "";
  // New products go into the category being viewed, else the first one.
  const fallback = state.locations.some((l) => l.id === state.filter)
    ? state.filter
    : state.locations[0]?.id || "";
  fillLocationSelect(p ? (locationOf(p)?.id || "") : fallback);
  hideNewLocationRow();
  showMsg("#product-msg", "");
  form.elements.quantity.value = p ? p.quantity : "";
  // The date field always holds the original date; the checkbox adds the 5 months on save.
  form.elements.expires_on.value = p ? (p.extended_from || p.expires_on || "") : "";
  form.elements.extend.checked = Boolean(p?.extended_from);
  updateExtendHint();
  form.elements.note.value = p ? p.note : "";
  $("#delete-btn").hidden = !state.editingId;
  $("#product-dialog").showModal();
}

async function saveProduct(event) {
  event.preventDefault();
  const form = event.target;
  const select = form.elements.location;
  // "+ Nuova categoria…" picked and a name typed but "Aggiungi" not tapped: create it now.
  if (select.value === NEW_LOCATION) {
    if ($("#new-location-name").value.trim()) {
      await addLocationFromProductForm();
      if (select.value === NEW_LOCATION) return; // creation failed, message is shown
    } else {
      select.value = select.dataset.previous || "";
      hideNewLocationRow();
    }
  }
  const date = form.elements.expires_on.value || null;
  const extend = Boolean(date) && form.elements.extend.checked;
  const row = {
    name: form.elements.name.value.trim(),
    location_id: select.value || null,
    quantity: form.elements.quantity.value.trim(),
    expires_on: extend ? addMonths(date, EXTEND_MONTHS) : date,
    extended_from: extend ? date : null,
    note: form.elements.note.value.trim(),
  };
  if (!row.name) return;

  $("#save-btn").disabled = true;
  const { error } = state.editingId
    ? await db.from("products").update(row).eq("id", state.editingId)
    : await db.from("products").insert({ ...row, household_id: state.household.id });
  $("#save-btn").disabled = false;

  if (error) {
    showMsg("#product-msg", `Errore nel salvataggio: ${error.message}`);
    return;
  }
  $("#product-dialog").close();
  loadData();
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
  loadData();
}

// Swipe already is the confirmation, so no dialog; the toast offers undo instead.
async function deleteProductBySwipe(p) {
  state.products = state.products.filter((x) => x.id !== p.id);
  render();
  const { error } = await db.from("products").delete().eq("id", p.id);
  if (error) {
    toast(`Errore nell'eliminazione: ${error.message}`);
    loadData();
    return;
  }
  toast(`"${p.name}" eliminato`, { label: "Annulla", run: () => restoreProduct(p) });
}

async function restoreProduct(p) {
  const { id, household_id, name, location_id, quantity, expires_on, extended_from, note, created_at } = p;
  // If its category was deleted meanwhile, bring it back without one.
  const stillThere = state.locations.some((l) => l.id === location_id);
  const { error } = await db.from("products").insert({
    id, household_id, name, location_id: stillThere ? location_id : null,
    quantity, expires_on, extended_from, note, created_at,
  });
  if (error) toast(`Errore nel ripristino: ${error.message}`);
  loadData();
}

// ---------- categories (locations) ----------

function showMsg(selector, text) {
  const node = $(selector);
  node.textContent = text;
  node.hidden = !text;
}

function locationErrorMessage(error) {
  return error.code === "23505" ? "Esiste già una categoria con questo nome." : `Errore: ${error.message}`;
}

// Returns the new category, or null (with the reason shown in msgSelector).
async function createLocation(rawName, msgSelector) {
  const name = rawName.trim();
  if (!name) return null;
  const position = Math.max(-1, ...state.locations.map((l) => l.position)) + 1;
  const { data, error } = await db
    .from("locations")
    .insert({ household_id: state.household.id, name, position })
    .select()
    .single();
  if (error) {
    showMsg(msgSelector, locationErrorMessage(error));
    return null;
  }
  showMsg(msgSelector, "");
  state.locations.push(data);
  render();
  return data;
}

async function renameLocation(loc, rawName, input) {
  const name = rawName.trim();
  if (!name || name === loc.name) {
    input.value = loc.name;
    return;
  }
  const { error } = await db.from("locations").update({ name }).eq("id", loc.id);
  if (error) {
    showMsg("#locations-msg", locationErrorMessage(error));
    input.value = loc.name;
    return;
  }
  showMsg("#locations-msg", "");
  loc.name = name;
  render();
}

async function deleteLocation(loc) {
  const used = state.products.filter((p) => p.location_id === loc.id).length;
  const detail = used
    ? `\n${used} prodott${used === 1 ? "o resterà" : "i resteranno"} senza categoria.`
    : "";
  if (!confirm(`Eliminare la categoria "${loc.name}"?${detail}`)) return;
  const { error } = await db.from("locations").delete().eq("id", loc.id);
  if (error) {
    showMsg("#locations-msg", `Errore: ${error.message}`);
    return;
  }
  showMsg("#locations-msg", "");
  await loadData();
}

function renderLocations() {
  const rows = state.locations.map((loc) => {
    const li = el("li", "location-row");
    const input = el("input");
    input.value = loc.name;
    input.maxLength = 40;
    input.setAttribute("aria-label", `Nome categoria ${loc.name}`);
    input.addEventListener("change", () => renameLocation(loc, input.value, input));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
    const count = state.products.filter((p) => p.location_id === loc.id).length;
    const del = el("button", "danger small", "Elimina");
    del.type = "button";
    del.setAttribute("aria-label", `Elimina ${loc.name} (${count} prodotti)`);
    del.addEventListener("click", () => deleteLocation(loc));
    li.append(input, el("span", "muted location-count", String(count)), del);
    return li;
  });
  $("#locations-list").replaceChildren(...rows);
  $("#locations-empty").hidden = rows.length > 0;
}

function openLocations() {
  if ($("#settings-dialog").open) $("#settings-dialog").close();
  showMsg("#locations-msg", "");
  $("#location-form").reset();
  renderLocations();
  $("#locations-dialog").showModal();
}

async function addLocationFromDialog(event) {
  event.preventDefault();
  const input = event.target.elements.name;
  if (await createLocation(input.value, "#locations-msg")) {
    input.value = "";
    renderLocations();
    input.focus();
  }
}

// Product form: categories + "no category" + "+ Nuova categoria…".
function fillLocationSelect(selectedId) {
  const select = $("#product-form").elements.location;
  const option = (value, label) => {
    const node = el("option", null, label);
    node.value = value;
    return node;
  };
  select.replaceChildren(
    ...state.locations.map((l) => option(l.id, l.name)),
    option("", "Nessuna categoria"),
    option(NEW_LOCATION, "+ Nuova categoria…"),
  );
  select.value = selectedId;
  select.dataset.previous = selectedId;
}

function hideNewLocationRow() {
  $("#new-location-row").hidden = true;
  $("#new-location-name").value = "";
}

function onLocationSelectChange(event) {
  const select = event.target;
  if (select.value === NEW_LOCATION) {
    $("#new-location-row").hidden = false;
    $("#new-location-name").focus();
  } else {
    select.dataset.previous = select.value;
    hideNewLocationRow();
  }
}

async function addLocationFromProductForm() {
  const created = await createLocation($("#new-location-name").value, "#product-msg");
  if (!created) return;
  fillLocationSelect(created.id);
  hideNewLocationRow();
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
  state.locations = [];
  state.filter = "all";
  if (!state.household) {
    unsubscribeFromChanges();
    showJoin();
    return;
  }
  rememberHousehold(state.household.id);
  showView("app-view");
  render();
  await loadData();
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
  $("#product-form").elements.location.addEventListener("change", onLocationSelectChange);
  $("#new-location-add").addEventListener("click", addLocationFromProductForm);
  $("#new-location-name").addEventListener("keydown", (e) => {
    // Enter adds the category instead of submitting the whole product form.
    if (e.key === "Enter") {
      e.preventDefault();
      addLocationFromProductForm();
    }
  });

  $("#manage-locations").addEventListener("click", openLocations);
  $("#location-form").addEventListener("submit", addLocationFromDialog);
  $("#locations-close").addEventListener("click", () => $("#locations-dialog").close());

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
  $("#product-form").elements.expires_on.addEventListener("input", updateExtendHint);
  $("#product-form").elements.extend.addEventListener("change", updateExtendHint);
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

  // Close the item menu on any tap outside it, on scroll, resize or Escape.
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("#item-menu")) closeItemMenu();
  });
  window.addEventListener("scroll", closeItemMenu, { passive: true });
  window.addEventListener("resize", closeItemMenu);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeItemMenu();
  });

  // iOS pauses the realtime connection while the app is in the background.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") closeItemMenu();
    if (document.visibilityState === "visible" && state.household) loadData();
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
