# Graph Report - grocery-tracker-app  (2026-11-02)

## Corpus Check
- 10 files · ~17,057 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 104 nodes · 288 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `480e4702`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- openHousehold
- Setup
- wireUp
- t
- index.ts
- app.js
- renderLocations
- afterJoin
- renderItem
- sw.js
- applyTheme
- scheduleReload

## God Nodes (most connected - your core abstractions)
1. `t()` - 31 edges
2. `wireUp()` - 27 edges
3. `loadData()` - 16 edges
4. `render()` - 15 edges
5. `toast()` - 14 edges
6. `renderItem()` - 13 edges
7. `openHousehold()` - 12 edges
8. `el()` - 10 edges
9. `openProduct()` - 10 edges
10. `showMsg()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `wireUp()` --indirect_call--> `applyTheme()`  [INFERRED]
  app.js → app.js  _Bridges community 11 → community 2_
- `wireUp()` --indirect_call--> `addShoppingFromForm()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 2_
- `renderFilters()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 6_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 2_
- `wireUp()` --indirect_call--> `joinHousehold()`  [INFERRED]
  app.js → app.js  _Bridges community 7 → community 2_

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "openHousehold"
Cohesion: 0.36
Nodes (8): leaveHousehold(), loadHouseholds(), openHousehold(), rememberedHousehold(), rememberHousehold(), showJoin(), showView(), start()

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "wireUp"
Cohesion: 0.36
Nodes (10): addLocationFromProductForm(), addMonths(), fillLocationSelect(), generateCode(), hideNewLocationRow(), onLocationSelectChange(), openProduct(), saveProduct() (+2 more)

### Community 3 - "t"
Cohesion: 0.29
Nodes (18): addShoppingFromForm(), addToShopping(), deleteProduct(), deleteProductBySwipe(), loadData(), markBought(), matchesFilter(), render() (+10 more)

### Community 5 - "app.js"
Cohesion: 0.15
Nodes (10): applyStaticTexts(), darkQuery, db, ITEM_ACTIONS, lang, SERVER_ERRORS_EN, setLanguage(), state (+2 more)

### Community 6 - "renderLocations"
Cohesion: 0.27
Nodes (11): addLocationFromDialog(), createLocation(), deleteLocation(), fillHouseholdSelect(), locationErrorMessage(), openLocations(), openSettings(), renameHousehold() (+3 more)

### Community 7 - "afterJoin"
Cohesion: 0.50
Nodes (4): afterJoin(), createHousehold(), joinHousehold(), serverMessage()

### Community 8 - "renderItem"
Cohesion: 0.27
Nodes (11): attachGestures(), closeItemMenu(), daysUntil(), el(), expiryStatus(), formatDate(), locationOf(), openItemMenu() (+3 more)

### Community 11 - "applyTheme"
Cohesion: 0.67
Nodes (4): applyTheme(), currentTheme(), savedTheme(), setTheme()

### Community 12 - "scheduleReload"
Cohesion: 0.50
Nodes (4): isUserBusy(), scheduleReload(), subscribeToChanges(), unsubscribeFromChanges()

## Knowledge Gaps
- **16 isolated node(s):** `db`, `state`, `STRINGS`, `SERVER_ERRORS_EN`, `lang` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `t` to `openHousehold`, `wireUp`, `app.js`, `renderLocations`, `afterJoin`, `renderItem`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `wireUp()` connect `wireUp` to `openHousehold`, `t`, `app.js`, `renderLocations`, `afterJoin`, `renderItem`, `applyTheme`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 15 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `STRINGS` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._