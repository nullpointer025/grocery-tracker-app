"use strict";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG;
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CURRENT_HOUSEHOLD_KEY = "grocery.currentHousehold";
const NO_LOCATION = "none"; // filter value for products without a category
const NEW_LOCATION = "__new__"; // select value that opens the "new category" field
// Fixed tabs next to "Tutti". A product's stage says where it is:
// "stock" = at home (normal list), "shopping" = in Lista spesa, "new" = bought, waiting for its details.
const TAB_NEW = "__tab_new";
const TAB_SHOPPING = "__tab_shopping";
const stageOf = (p) => p.stage || "stock";

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

// ---------- language (Italiano / English) ----------

const LANGUAGE_KEY = "grocery.language";

// Every UI text. Functions take the variable parts (names, counts, dates).
const STRINGS = {
  it: {
    loading: "Caricamento…",
    joinTitle: "Entra in un gruppo",
    inviteCode: "Codice invito",
    join: "Entra",
    or: "oppure",
    createTitle: "Crea un nuovo gruppo",
    groupName: "Nome del gruppo",
    groupNamePh: "es. Casa",
    defaultGroupName: "Casa",
    inviteCodePick: "Codice invito (scegli tu, almeno 6 caratteri)",
    generate: "Genera",
    createGroup: "Crea gruppo",
    backToList: "Torna alla lista",
    settings: "Impostazioni",
    searchPh: "Cerca prodotto…",
    noProducts: "Nessun prodotto.",
    addProduct: "Aggiungi prodotto",
    name: "Nome",
    category: "Categoria",
    categoryPh: "es. Frigo",
    newCategoryName: "Nome nuova categoria",
    add: "Aggiungi",
    quantity: "Quantità",
    quantityPh: "es. 2 conf",
    expiry: "Scadenza",
    extendLabel: `+5 mesi alla scadenza`,
    note: "Nota",
    notePh: "es. il prima possibile",
    delete: "Elimina",
    cancel: "Annulla",
    save: "Salva",
    group: "Gruppo",
    activeGroup: "Gruppo attivo",
    inviteCodeColon: "Codice invito:",
    shareCode: "Condividi codice",
    otherGroup: "Altro gruppo",
    categories: "Categorie",
    manageCategories: "Gestisci categorie",
    language: "Lingua",
    leaveGroup: "Esci dal gruppo",
    close: "Chiudi",
    categoriesIntro: "Crea i posti dove tieni i prodotti, es. Frigo, Freezer, Dispensa.",
    noCategories: "Nessuna categoria.",
    newCategory: "Nuova categoria",
    tabNew: "Nuovi",
    tabShopping: "Lista spesa",
    toBuy: "Da comprare",
    shoppingPh: "Aggiungi alla lista spesa…",
    emptyShopping: "La lista spesa è vuota. Tieni premuto un prodotto e scegli \"Da comprare\".",
    emptyNew: "Nessun prodotto nuovo. Spunta i prodotti nella lista spesa e completali qui.",
    titleComplete: "Completa prodotto",
    boughtAria: (name) => `${name}: comprato`,
    movedToNew: (name) => `"${name}" spostato in Nuovi`,
    addedToShopping: (name) => `"${name}" aggiunto alla lista spesa`,
    alreadyInShopping: (name) => `"${name}" è già nella lista spesa`,

    relExpiredDays: (n) => `scaduto da ${n} giorni`,
    relYesterday: "scaduto ieri",
    relToday: "scade oggi",
    relTomorrow: "scade domani",
    relInDays: (n) => `tra ${n} giorni`,
    extendAria: (name) => `${name}: +5 mesi alla scadenza`,
    extendNeedsDate: "Imposta una scadenza per usare +5 mesi",
    newExpiry: (date) => `Nuova scadenza: ${date}`,
    duplicate: "Duplica",
    all: "Tutti",
    noCategory: "Senza categoria",
    addCategoryChip: "+ Categoria",
    summaryExpired: (n) => `${n} scadut${n === 1 ? "o" : "i"}`,
    summarySoon: (n) => `${n} entro 7 giorni`,
    summaryWarn: (n) => `${n} entro 14 giorni`,
    error: (msg) => `Errore: ${msg}`,
    loadError: (msg) => `Errore nel caricamento: ${msg}`,
    saveError: (msg) => `Errore nel salvataggio: ${msg}`,
    deleteError: (msg) => `Errore nell'eliminazione: ${msg}`,
    restoreError: (msg) => `Errore nel ripristino: ${msg}`,
    titleNew: "Nuovo prodotto",
    titleEdit: "Modifica prodotto",
    titleDuplicate: "Duplica prodotto",
    confirmDelete: (name) => `Eliminare "${name}"?`,
    deleted: (name) => `"${name}" eliminato`,
    undo: "Annulla",
    categoryExists: "Esiste già una categoria con questo nome.",
    confirmDeleteCategory: (name, used) => `Eliminare la categoria "${name}"?`
      + (used ? `\n${used} prodott${used === 1 ? "o resterà" : "i resteranno"} senza categoria.` : ""),
    categoryNameAria: (name) => `Nome categoria ${name}`,
    deleteCategoryAria: (name, n) => `Elimina ${name} (${n} prodotti)`,
    noCategoryOption: "Nessuna categoria",
    newCategoryOption: "+ Nuova categoria…",
    joining: "Accesso al gruppo…",
    creating: "Creazione del gruppo…",
    shareText: (name, code) => `Entra nel gruppo "${name}" su Grocery Tracker con il codice: ${code}`,
    codeCopied: "Codice copiato",
    confirmLeave: (name) => `Uscire dal gruppo "${name}"? Potrai rientrare con il codice invito.`,
    groupRenamed: "Nome del gruppo aggiornato",
    configMissing: "Configura SUPABASE_URL e SUPABASE_ANON_KEY in config.js (vedi README).",
    connectionError: (msg) => `Errore di connessione: ${msg}`,
  },
  en: {
    loading: "Loading…",
    joinTitle: "Join a group",
    inviteCode: "Invite code",
    join: "Join",
    or: "or",
    createTitle: "Create a new group",
    groupName: "Group name",
    groupNamePh: "e.g. Home",
    defaultGroupName: "Home",
    inviteCodePick: "Invite code (your choice, at least 6 characters)",
    generate: "Generate",
    createGroup: "Create group",
    backToList: "Back to the list",
    settings: "Settings",
    searchPh: "Search product…",
    noProducts: "No products.",
    addProduct: "Add product",
    name: "Name",
    category: "Category",
    categoryPh: "e.g. Fridge",
    newCategoryName: "New category name",
    add: "Add",
    quantity: "Quantity",
    quantityPh: "e.g. 2 packs",
    expiry: "Expiry date",
    extendLabel: "+5 months to the expiry date",
    note: "Note",
    notePh: "e.g. use soon",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    group: "Group",
    activeGroup: "Active group",
    inviteCodeColon: "Invite code:",
    shareCode: "Share code",
    otherGroup: "Other group",
    categories: "Categories",
    manageCategories: "Manage categories",
    language: "Language",
    leaveGroup: "Leave group",
    close: "Close",
    categoriesIntro: "Create the places where you keep your products, e.g. Fridge, Freezer, Pantry.",
    noCategories: "No categories.",
    newCategory: "New category",
    tabNew: "New",
    tabShopping: "Shopping list",
    toBuy: "To buy",
    shoppingPh: "Add to the shopping list…",
    emptyShopping: "The shopping list is empty. Hold a product and choose \"To buy\".",
    emptyNew: "No new products. Tick products in the shopping list and complete them here.",
    titleComplete: "Complete product",
    boughtAria: (name) => `${name}: bought`,
    movedToNew: (name) => `"${name}" moved to New`,
    addedToShopping: (name) => `"${name}" added to the shopping list`,
    alreadyInShopping: (name) => `"${name}" is already in the shopping list`,

    relExpiredDays: (n) => `expired ${n} days ago`,
    relYesterday: "expired yesterday",
    relToday: "expires today",
    relTomorrow: "expires tomorrow",
    relInDays: (n) => `in ${n} days`,
    extendAria: (name) => `${name}: +5 months to the expiry date`,
    extendNeedsDate: "Set an expiry date to use +5 months",
    newExpiry: (date) => `New expiry date: ${date}`,
    duplicate: "Duplicate",
    all: "All",
    noCategory: "No category",
    addCategoryChip: "+ Category",
    summaryExpired: (n) => `${n} expired`,
    summarySoon: (n) => `${n} within 7 days`,
    summaryWarn: (n) => `${n} within 14 days`,
    error: (msg) => `Error: ${msg}`,
    loadError: (msg) => `Error loading: ${msg}`,
    saveError: (msg) => `Error saving: ${msg}`,
    deleteError: (msg) => `Error deleting: ${msg}`,
    restoreError: (msg) => `Error restoring: ${msg}`,
    titleNew: "New product",
    titleEdit: "Edit product",
    titleDuplicate: "Duplicate product",
    confirmDelete: (name) => `Delete "${name}"?`,
    deleted: (name) => `"${name}" deleted`,
    undo: "Undo",
    categoryExists: "A category with this name already exists.",
    confirmDeleteCategory: (name, used) => `Delete the category "${name}"?`
      + (used ? `\n${used} product${used === 1 ? "" : "s"} will be left without a category.` : ""),
    categoryNameAria: (name) => `Category name ${name}`,
    deleteCategoryAria: (name, n) => `Delete ${name} (${n} products)`,
    noCategoryOption: "No category",
    newCategoryOption: "+ New category…",
    joining: "Joining the group…",
    creating: "Creating the group…",
    shareText: (name, code) => `Join the group "${name}" on Grocery Tracker with the code: ${code}`,
    codeCopied: "Code copied",
    confirmLeave: (name) => `Leave the group "${name}"? You can join again with the invite code.`,
    groupRenamed: "Group name updated",
    configMissing: "Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js (see README).",
    connectionError: (msg) => `Connection error: ${msg}`,
  },
};

// The database functions answer in Italian; translate the ones users can see.
const SERVER_ERRORS_EN = {
  "Codice non valido": "Invalid code",
  "Codice già in uso, scegline un altro": "Code already in use, pick another one",
  "Il codice deve avere almeno 6 caratteri": "The code must be at least 6 characters",
  "Non autenticato": "Not signed in",
};

function savedLanguage() {
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY);
    return lang in STRINGS ? lang : "it";
  } catch {
    return "it";
  }
}

let lang = savedLanguage();

function t(key, ...args) {
  const value = STRINGS[lang][key] ?? STRINGS.it[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function serverMessage(message) {
  return lang === "en" ? SERVER_ERRORS_EN[message] || message : message;
}

// Fixed texts in index.html.
function applyStaticTexts() {
  document.documentElement.lang = lang;
  for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll("[data-i18n-ph]")) node.placeholder = t(node.dataset.i18nPh);
  for (const node of document.querySelectorAll("[data-i18n-aria]")) {
    node.setAttribute("aria-label", t(node.dataset.i18nAria));
  }
}

function setLanguage(next) {
  if (!(next in STRINGS) || next === lang) return;
  lang = next;
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Private mode: the choice lasts until the app is closed.
  }
  applyStaticTexts();
  render();
  if ($("#locations-dialog").open) renderLocations();
}

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
  if (days < -1) return t("relExpiredDays", -days);
  if (days === -1) return t("relYesterday");
  if (days === 0) return t("relToday");
  if (days === 1) return t("relTomorrow");
  return t("relInDays", days);
}

// Dated products first (nearest first), then products without a date.
function compareProducts(a, b) {
  if (a.expires_on && b.expires_on) {
    return a.expires_on.localeCompare(b.expires_on) || a.name.localeCompare(b.name, lang);
  }
  if (a.expires_on) return -1;
  if (b.expires_on) return 1;
  return a.name.localeCompare(b.name, lang);
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
  if (filter === TAB_SHOPPING) return stageOf(p) === "shopping";
  if (filter === TAB_NEW) return stageOf(p) === "new";
  // "Tutti" and the categories only show what is at home.
  if (stageOf(p) !== "stock") return false;
  if (filter === "all") return true;
  if (filter === NO_LOCATION) return !locationOf(p);
  return p.location_id === filter;
}

function render() {
  // The selected category may have been deleted (here or on another phone).
  const filterExists = ["all", NO_LOCATION, TAB_NEW, TAB_SHOPPING].includes(state.filter)
    || state.locations.some((l) => l.id === state.filter);
  if (!filterExists) state.filter = "all";

  const shopping = state.filter === TAB_SHOPPING;
  const query = state.search.trim().toLowerCase();
  const visible = state.products
    .filter((p) => matchesFilter(p, state.filter))
    .filter((p) => !query || p.name.toLowerCase().includes(query))
    .sort(shopping ? compareByName : compareProducts);

  $("#app-title").textContent = state.household ? state.household.name : "Grocery Tracker";
  $("#list").replaceChildren(...visible.map(shopping ? renderShoppingItem : renderItem));
  $("#empty").hidden = visible.length > 0;
  $("#empty").textContent = t(shopping ? "emptyShopping" : state.filter === TAB_NEW ? "emptyNew" : "noProducts");
  // Lista spesa has its own quick "add" field instead of the + button.
  $("#shopping-form").hidden = !shopping;
  $("#add-btn").hidden = shopping;
  renderFilters();
  renderSummary();
}

function compareByName(a, b) {
  return a.name.localeCompare(b.name, lang);
}

// Lista spesa row: checkbox + name. Ticking it (or tapping the row) moves it to "Nuovi".
function renderShoppingItem(p) {
  const li = el("li", "item item-shopping");
  const btn = el("button", "item-btn");
  btn.type = "button";
  attachGestures(btn, {
    onTap: () => markBought(p),
    onLongPress: () => openItemMenu(p, btn.closest(".item-card") || btn),
    onSwipeDelete: () => deleteProductBySwipe(p),
  });
  btn.append(el("span", "item-name", p.name));

  const check = el("label", "item-check");
  const box = el("input");
  box.type = "checkbox";
  box.setAttribute("aria-label", t("boughtAria", p.name));
  box.addEventListener("change", () => markBought(p));
  check.append(box);

  const swipeBg = el("span", "item-swipe-bg");
  swipeBg.setAttribute("aria-hidden", "true");
  swipeBg.append(el("span", "item-swipe-label", t("delete")));

  const card = el("div", "item-card");
  card.append(check, btn);
  li.append(swipeBg, card);
  return li;
}

async function setStage(p, stage) {
  const before = p.stage;
  p.stage = stage;
  render();
  const { error } = await db.from("products").update({ stage }).eq("id", p.id);
  if (error) {
    p.stage = before;
    render();
    toast(t("error", error.message));
    return false;
  }
  return true;
}

async function markBought(p) {
  if (await setStage(p, "new")) {
    toast(t("movedToNew", p.name), { label: t("undo"), run: () => setStage(p, "shopping") });
  }
}

// "Da comprare": a new row in Lista spesa with the same name (and category, used once it's bought).
// The product at home stays where it is.
async function addToShopping(p) {
  const name = p.name.trim();
  const already = state.products.some(
    (x) => stageOf(x) === "shopping" && x.name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (already) {
    toast(t("alreadyInShopping", name));
    return;
  }
  const { error } = await db.from("products").insert({
    household_id: state.household.id,
    name,
    location_id: p.location_id || null,
    stage: "shopping",
  });
  if (error) {
    toast(t("error", error.message));
    return;
  }
  toast(t("addedToShopping", name));
  loadData();
}

async function addShoppingFromForm(event) {
  event.preventDefault();
  const input = event.target.elements.name;
  const name = input.value.trim();
  if (!name) return;
  const { error } = await db.from("products").insert({ household_id: state.household.id, name, stage: "shopping" });
  if (error) {
    toast(t("error", error.message));
    return;
  }
  input.value = "";
  input.focus();
  loadData();
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
  swipeBg.append(el("span", "item-swipe-label", t("delete")));

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
  box.setAttribute("aria-label", t("extendAria", p.name));
  box.addEventListener("change", () => toggleExtended(p, box.checked));
  label.title = p.expires_on ? t("extendLabel") : t("extendNeedsDate");
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
  if (!hint.hidden) hint.textContent = t("newExpiry", formatDate(addMonths(date, EXTEND_MONTHS)));
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
    toast(t("error", error.message));
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
// `when` decides which products get the action.
const ITEM_ACTIONS = [
  {
    label: () => t("duplicate"),
    when: (p) => stageOf(p) !== "shopping",
    run: (p) => openProduct(p, { duplicate: true }),
  },
  {
    label: () => t("toBuy"),
    when: (p) => stageOf(p) !== "shopping",
    run: (p) => addToShopping(p),
  },
];

function openItemMenu(p, anchor) {
  const actions = ITEM_ACTIONS.filter((action) => action.when(p));
  if (!actions.length) return;
  const menu = $("#item-menu");
  menu.replaceChildren(...actions.map((action) => {
    const btn = el("button", "item-menu-btn", action.label());
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
    { id: "all", label: t("all") },
    { id: TAB_NEW, label: t("tabNew") },
    { id: TAB_SHOPPING, label: t("tabShopping") },
    ...state.locations.map((l) => ({ id: l.id, label: l.name })),
  ];
  // Only show "Senza categoria" when something is actually in it.
  if (count(NO_LOCATION) > 0) options.push({ id: NO_LOCATION, label: t("noCategory") });

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

  const add = el("button", "chip chip-add", state.locations.length ? "+" : t("addCategoryChip"));
  add.type = "button";
  add.setAttribute("aria-label", t("manageCategories"));
  add.addEventListener("click", openLocations);
  $("#filters").replaceChildren(...chips, add);
}

function renderSummary() {
  const count = (status) => state.products
    .filter((p) => stageOf(p) === "stock" && expiryStatus(p) === status).length;
  const parts = [];
  const expired = count("expired");
  const soon = count("soon");
  const warn = count("warn");
  if (expired) parts.push(t("summaryExpired", expired));
  if (soon) parts.push(t("summarySoon", soon));
  if (warn) parts.push(t("summaryWarn", warn));
  const fixedTab = state.filter === TAB_NEW || state.filter === TAB_SHOPPING;
  $("#summary").textContent = fixedTab ? "" : parts.join(" · ");
}

let toastTimer;
// Optional action renders a button inside the toast, e.g. { label: t("undo"), run }.
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
  const [locations, products, household] = await Promise.all([
    db.from("locations").select("*").eq("household_id", householdId)
      .order("position").order("created_at"),
    db.from("products").select("*").eq("household_id", householdId),
    // Picks up a group name changed on another phone.
    db.from("households").select("name").eq("id", householdId).maybeSingle(),
  ]);
  const error = locations.error || products.error;
  if (error) {
    toast(t("loadError", error.message));
    return;
  }
  if (state.household?.id !== householdId) return; // switched group meanwhile
  if (household.data?.name) state.household.name = household.data.name;
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
  const completing = p && !duplicate && stageOf(p) === "new";
  $("#product-title").textContent = t(duplicate ? "titleDuplicate" : completing ? "titleComplete" : p ? "titleEdit" : "titleNew");
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
    stage: "stock", // saving the form puts it at home (this is how "Nuovi" items get filed)
  };
  if (!row.name) return;

  $("#save-btn").disabled = true;
  const { error } = state.editingId
    ? await db.from("products").update(row).eq("id", state.editingId)
    : await db.from("products").insert({ ...row, household_id: state.household.id });
  $("#save-btn").disabled = false;

  if (error) {
    showMsg("#product-msg", t("saveError", error.message));
    return;
  }
  $("#product-dialog").close();
  loadData();
}

async function deleteProduct() {
  const name = $("#product-form").elements.name.value;
  if (!state.editingId || !confirm(t("confirmDelete", name))) return;
  const { error } = await db.from("products").delete().eq("id", state.editingId);
  if (error) {
    toast(t("deleteError", error.message));
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
    toast(t("deleteError", error.message));
    loadData();
    return;
  }
  toast(t("deleted", p.name), { label: t("undo"), run: () => restoreProduct(p) });
}

async function restoreProduct(p) {
  const { id, household_id, name, location_id, quantity, expires_on, extended_from, note, created_at } = p;
  const stage = stageOf(p);
  // If its category was deleted meanwhile, bring it back without one.
  const stillThere = state.locations.some((l) => l.id === location_id);
  const { error } = await db.from("products").insert({
    id, household_id, name, location_id: stillThere ? location_id : null,
    quantity, expires_on, extended_from, note, created_at, stage,
  });
  if (error) toast(t("restoreError", error.message));
  loadData();
}

// ---------- categories (locations) ----------

function showMsg(selector, text) {
  const node = $(selector);
  node.textContent = text;
  node.hidden = !text;
}

function locationErrorMessage(error) {
  return error.code === "23505" ? t("categoryExists") : t("error", error.message);
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
  if (!confirm(t("confirmDeleteCategory", loc.name, used))) return;
  const { error } = await db.from("locations").delete().eq("id", loc.id);
  if (error) {
    showMsg("#locations-msg", t("error", error.message));
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
    input.setAttribute("aria-label", t("categoryNameAria", loc.name));
    input.addEventListener("change", () => renameLocation(loc, input.value, input));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
    });
    const count = state.products.filter((p) => p.location_id === loc.id).length;
    const del = el("button", "danger small", t("delete"));
    del.type = "button";
    del.setAttribute("aria-label", t("deleteCategoryAria", loc.name, count));
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
    option("", t("noCategoryOption")),
    option(NEW_LOCATION, t("newCategoryOption")),
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
    $("#join-msg").textContent = serverMessage(error.message);
    return;
  }
  await loadHouseholds();
  await openHousehold(householdId);
}

async function joinHousehold(event) {
  event.preventDefault();
  $("#join-msg").textContent = t("joining");
  await afterJoin(await db.rpc("join_household", { code: event.target.elements.code.value }));
}

async function createHousehold(event) {
  event.preventDefault();
  const form = event.target;
  $("#join-msg").textContent = t("creating");
  await afterJoin(await db.rpc("create_household", {
    code: form.elements.code.value,
    household_name: form.elements.name.value.trim() || t("defaultGroupName"),
  }));
}

async function shareCode() {
  const { name, invite_code: code } = state.household;
  const text = t("shareText", name, code);
  try {
    if (navigator.share) {
      await navigator.share({ title: "Grocery Tracker", text, url: location.href });
    } else {
      await navigator.clipboard.writeText(code);
      toast(t("codeCopied"));
    }
  } catch {
    // The user closed the share sheet.
  }
}

async function leaveHousehold() {
  const { id, name } = state.household;
  if (!confirm(t("confirmLeave", name))) return;
  const { error } = await db.from("household_members").delete().eq("household_id", id).eq("user_id", state.user.id);
  if (error) {
    toast(t("error", error.message));
    return;
  }
  $("#settings-dialog").close();
  await loadHouseholds();
  await openHousehold(null);
}

// ---------- settings ----------

function openSettings() {
  const { name, invite_code: code } = state.household;
  $("#household-name").value = name;
  $("#household-code").textContent = code;
  $("#language-select").value = lang;
  showMsg("#household-msg", "");
  fillHouseholdSelect();
  $("#settings-dialog").showModal();
}

function fillHouseholdSelect() {
  const select = $("#household-select");
  select.replaceChildren(...state.households.map((h) => {
    const option = el("option", null, h.name);
    option.value = h.id;
    option.selected = h.id === state.household.id;
    return option;
  }));
  $("#household-switch").hidden = state.households.length < 2;
}

// Everyone in the group sees the new name (it's stored on the household).
async function renameHousehold() {
  const input = $("#household-name");
  const household = state.household;
  const name = input.value.trim();
  if (!name || name === household.name) {
    input.value = household.name;
    showMsg("#household-msg", "");
    return;
  }
  // .select() so a change refused by the row policies (0 rows, no error) is noticed too.
  const { data, error } = await db.from("households").update({ name }).eq("id", household.id).select("id");
  if (error || !data?.length) {
    showMsg("#household-msg", t("error", error?.message || "—"));
    input.value = household.name;
    return;
  }
  showMsg("#household-msg", "");
  household.name = name;
  input.value = name;
  fillHouseholdSelect();
  render();
  toast(t("groupRenamed"));
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
  $("#shopping-form").addEventListener("submit", addShoppingFromForm);
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
  $("#household-name").addEventListener("change", renameHousehold);
  $("#household-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.target.blur();
  });
  $("#language-select").addEventListener("change", (e) => setLanguage(e.target.value));

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
  applyStaticTexts();
  wireUp();

  if (SUPABASE_URL.includes("YOUR-PROJECT-REF")) {
    $("#loading-msg").textContent = t("configMissing");
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
    $("#loading-msg").textContent = t("connectionError", err.message);
    showView("loading-view");
  }
}

start();
