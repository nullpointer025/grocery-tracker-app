# Graph Report - grocery-tracker-app  (2026-11-01)

## Corpus Check
- 8 files · ~6,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 82 nodes · 195 edges · 9 communities (7 shown, 2 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0b31bdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- wireUp
- Setup
- openProduct
- loadData
- index.ts
- app.js
- render
- sw.js

## God Nodes (most connected - your core abstractions)
1. `wireUp()` - 22 edges
2. `loadData()` - 13 edges
3. `render()` - 12 edges
4. `renderItem()` - 12 edges
5. `openHousehold()` - 12 edges
6. `toast()` - 9 edges
7. `el()` - 8 edges
8. `openProduct()` - 7 edges
9. `showMsg()` - 7 edges
10. `renderLocations()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `render()` --indirect_call--> `renderItem()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 5_
- `subscribeToChanges()` --indirect_call--> `scheduleReload()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `saveProduct()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 0_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_
- `wireUp()` --indirect_call--> `openSettings()`  [INFERRED]
  app.js → app.js  _Bridges community 5 → community 0_

## Import Cycles
- None detected.

## Communities (9 total, 2 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.24
Nodes (15): afterJoin(), createHousehold(), generateCode(), joinHousehold(), leaveHousehold(), loadHouseholds(), openHousehold(), rememberedHousehold() (+7 more)

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "openProduct"
Cohesion: 0.47
Nodes (6): addLocationFromProductForm(), fillLocationSelect(), hideNewLocationRow(), onLocationSelectChange(), openProduct(), saveProduct()

### Community 3 - "loadData"
Cohesion: 0.43
Nodes (8): deleteProduct(), deleteProductBySwipe(), isUserBusy(), loadData(), restoreProduct(), scheduleReload(), shareCode(), toast()

### Community 5 - "app.js"
Cohesion: 0.19
Nodes (19): attachGestures(), closeItemMenu(), currentSubscription(), daysUntil(), db, el(), expiryStatus(), formatDate() (+11 more)

### Community 6 - "render"
Cohesion: 0.24
Nodes (13): addLocationFromDialog(), compareProducts(), createLocation(), deleteLocation(), locationErrorMessage(), locationOf(), matchesFilter(), openLocations() (+5 more)

## Knowledge Gaps
- **12 isolated node(s):** `db`, `state`, `ITEM_ACTIONS`, `isIOS`, `APP_SHELL` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `wireUp()` connect `wireUp` to `openProduct`, `loadData`, `app.js`, `render`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `render()` (e.g. with `compareProducts()` and `renderItem()`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `ITEM_ACTIONS` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._