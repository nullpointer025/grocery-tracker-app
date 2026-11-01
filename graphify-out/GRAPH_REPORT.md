# Graph Report - grocery-tracker-app  (2026-11-01)

## Corpus Check
- 7 files · ~5,015 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 66 nodes · 133 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bd2d8710`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- wireUp
- Setup
- app.js
- loadProducts
- index.ts
- renderItem
- el
- render
- togglePush
- sw.js

## God Nodes (most connected - your core abstractions)
1. `wireUp()` - 19 edges
2. `openHousehold()` - 12 edges
3. `renderItem()` - 10 edges
4. `render()` - 8 edges
5. `loadProducts()` - 8 edges
6. `toast()` - 7 edges
7. `el()` - 6 edges
8. `togglePush()` - 6 edges
9. `start()` - 6 edges
10. `Setup` - 6 edges

## Surprising Connections (you probably didn't know these)
- `render()` --indirect_call--> `renderItem()`  [INFERRED]
  app.js → app.js  _Bridges community 7 → community 5_
- `wireUp()` --indirect_call--> `saveProduct()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `openSettings()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_
- `wireUp()` --indirect_call--> `togglePush()`  [INFERRED]
  app.js → app.js  _Bridges community 8 → community 0_
- `renderItem()` --calls--> `el()`  [EXTRACTED]
  app.js → app.js  _Bridges community 6 → community 5_

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.36
Nodes (11): afterJoin(), createHousehold(), joinHousehold(), leaveHousehold(), loadHouseholds(), openHousehold(), rememberedHousehold(), showJoin() (+3 more)

### Community 1 - "Setup"
Cohesion: 0.20
Nodes (9): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Grocery Tracker, Setup, Trying it on the PC (+1 more)

### Community 2 - "app.js"
Cohesion: 0.22
Nodes (8): db, generateCode(), isIOS, ITEM_ACTIONS, LOCATION_LABEL, LOCATIONS, rememberHousehold(), state

### Community 3 - "loadProducts"
Cohesion: 0.32
Nodes (8): deleteProduct(), loadProducts(), saveProduct(), scheduleReload(), shareCode(), subscribeToChanges(), toast(), unsubscribeFromChanges()

### Community 5 - "renderItem"
Cohesion: 0.40
Nodes (5): attachPress(), formatDate(), openProduct(), relativeDays(), renderItem()

### Community 6 - "el"
Cohesion: 0.40
Nodes (5): closeItemMenu(), el(), openItemMenu(), openSettings(), renderFilters()

### Community 7 - "render"
Cohesion: 0.40
Nodes (5): compareProducts(), daysUntil(), expiryStatus(), render(), renderSummary()

### Community 8 - "togglePush"
Cohesion: 0.67
Nodes (4): currentSubscription(), togglePush(), updatePushUI(), urlBase64ToUint8Array()

## Knowledge Gaps
- **14 isolated node(s):** `db`, `LOCATIONS`, `LOCATION_LABEL`, `state`, `ITEM_ACTIONS` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `wireUp()` connect `wireUp` to `app.js`, `loadProducts`, `renderItem`, `el`, `render`, `togglePush`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `wireUp()` (e.g. with `createHousehold()` and `deleteProduct()`) actually correct?**
  _`wireUp()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `render()` (e.g. with `compareProducts()` and `renderItem()`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `LOCATIONS`, `LOCATION_LABEL` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._