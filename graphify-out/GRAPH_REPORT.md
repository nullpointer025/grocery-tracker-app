# Graph Report - grocery-tracker-app  (2026-11-01)

## Corpus Check
- 9 files · ~7,460 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 86 nodes · 210 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f87f63a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- wireUp
- Setup
- render
- loadData
- index.ts
- app.js
- openProduct
- el
- renderItem
- sw.js

## God Nodes (most connected - your core abstractions)
1. `wireUp()` - 23 edges
2. `render()` - 13 edges
3. `renderItem()` - 13 edges
4. `loadData()` - 13 edges
5. `openHousehold()` - 12 edges
6. `toast()` - 10 edges
7. `el()` - 9 edges
8. `openProduct()` - 8 edges
9. `saveProduct()` - 7 edges
10. `showMsg()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `render()` --indirect_call--> `renderItem()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 8_
- `wireUp()` --indirect_call--> `updateExtendHint()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_
- `subscribeToChanges()` --indirect_call--> `scheduleReload()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 0_
- `wireUp()` --indirect_call--> `openSettings()`  [INFERRED]
  app.js → app.js  _Bridges community 7 → community 0_

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.24
Nodes (15): afterJoin(), createHousehold(), generateCode(), joinHousehold(), leaveHousehold(), loadHouseholds(), openHousehold(), rememberedHousehold() (+7 more)

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "render"
Cohesion: 0.40
Nodes (6): compareProducts(), locationOf(), matchesFilter(), openLocations(), render(), renderFilters()

### Community 3 - "loadData"
Cohesion: 0.43
Nodes (8): deleteProduct(), deleteProductBySwipe(), isUserBusy(), loadData(), restoreProduct(), scheduleReload(), shareCode(), toast()

### Community 5 - "app.js"
Cohesion: 0.33
Nodes (8): currentSubscription(), db, isIOS, ITEM_ACTIONS, state, togglePush(), updatePushUI(), urlBase64ToUint8Array()

### Community 6 - "openProduct"
Cohesion: 0.19
Nodes (16): addLocationFromDialog(), addLocationFromProductForm(), addMonths(), createLocation(), deleteLocation(), fillLocationSelect(), formatDate(), hideNewLocationRow() (+8 more)

### Community 7 - "el"
Cohesion: 0.50
Nodes (4): el(), openSettings(), renderExtendCheck(), toggleExtended()

### Community 8 - "renderItem"
Cohesion: 0.32
Nodes (8): attachGestures(), closeItemMenu(), daysUntil(), expiryStatus(), openItemMenu(), relativeDays(), renderItem(), renderSummary()

## Knowledge Gaps
- **12 isolated node(s):** `db`, `state`, `ITEM_ACTIONS`, `isIOS`, `APP_SHELL` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `wireUp()` connect `wireUp` to `render`, `loadData`, `app.js`, `openProduct`, `el`, `renderItem`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `render()` (e.g. with `compareProducts()` and `renderItem()`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `ITEM_ACTIONS` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._