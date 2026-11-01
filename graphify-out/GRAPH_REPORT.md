# Graph Report - grocery-tracker-app  (2026-11-01)

## Corpus Check
- 9 files · ~8,264 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 91 nodes · 245 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf409857`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- wireUp
- Setup
- openProduct
- t
- index.ts
- app.js
- render
- afterJoin
- renderItem
- sw.js
- start
- leaveHousehold

## God Nodes (most connected - your core abstractions)
1. `t()` - 25 edges
2. `wireUp()` - 24 edges
3. `render()` - 15 edges
4. `renderItem()` - 14 edges
5. `loadData()` - 14 edges
6. `openHousehold()` - 12 edges
7. `toast()` - 10 edges
8. `el()` - 9 edges
9. `openProduct()` - 9 edges
10. `showMsg()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `render()` --indirect_call--> `renderItem()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 8_
- `wireUp()` --indirect_call--> `updateExtendHint()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 0_
- `subscribeToChanges()` --indirect_call--> `scheduleReload()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 5_
- `wireUp()` --indirect_call--> `deleteProduct()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.53
Nodes (6): generateCode(), openHousehold(), rememberHousehold(), showJoin(), showView(), wireUp()

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "openProduct"
Cohesion: 0.27
Nodes (10): addLocationFromProductForm(), addMonths(), fillLocationSelect(), formatDate(), hideNewLocationRow(), locationOf(), onLocationSelectChange(), openProduct() (+2 more)

### Community 3 - "t"
Cohesion: 0.36
Nodes (12): deleteLocation(), deleteProduct(), deleteProductBySwipe(), isUserBusy(), loadData(), renderLocations(), restoreProduct(), scheduleReload() (+4 more)

### Community 5 - "app.js"
Cohesion: 0.22
Nodes (8): db, ITEM_ACTIONS, lang, SERVER_ERRORS_EN, state, STRINGS, subscribeToChanges(), unsubscribeFromChanges()

### Community 6 - "render"
Cohesion: 0.23
Nodes (13): addLocationFromDialog(), compareProducts(), createLocation(), fillHouseholdSelect(), locationErrorMessage(), matchesFilter(), openLocations(), openSettings() (+5 more)

### Community 7 - "afterJoin"
Cohesion: 0.50
Nodes (4): afterJoin(), createHousehold(), joinHousehold(), serverMessage()

### Community 8 - "renderItem"
Cohesion: 0.29
Nodes (10): attachGestures(), closeItemMenu(), daysUntil(), el(), expiryStatus(), openItemMenu(), relativeDays(), renderExtendCheck() (+2 more)

### Community 11 - "start"
Cohesion: 0.50
Nodes (4): applyStaticTexts(), rememberedHousehold(), setLanguage(), start()

## Knowledge Gaps
- **14 isolated node(s):** `db`, `state`, `STRINGS`, `SERVER_ERRORS_EN`, `lang` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `t` to `openProduct`, `app.js`, `render`, `afterJoin`, `renderItem`, `start`, `leaveHousehold`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `wireUp()` connect `wireUp` to `openProduct`, `t`, `app.js`, `render`, `afterJoin`, `renderItem`, `start`, `leaveHousehold`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `render()` (e.g. with `compareProducts()` and `renderItem()`) actually correct?**
  _`render()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `STRINGS` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._