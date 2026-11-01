# Graph Report - grocery-tracker-app  (2026-11-01)

## Corpus Check
- 10 files · ~9,112 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 98 nodes · 275 edges · 13 communities (10 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3546f1c`
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
- setLanguage
- scheduleReload

## God Nodes (most connected - your core abstractions)
1. `t()` - 31 edges
2. `wireUp()` - 25 edges
3. `loadData()` - 16 edges
4. `render()` - 15 edges
5. `toast()` - 14 edges
6. `renderItem()` - 13 edges
7. `openHousehold()` - 12 edges
8. `el()` - 10 edges
9. `openProduct()` - 10 edges
10. `showMsg()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `wireUp()` --indirect_call--> `addShoppingFromForm()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `updateExtendHint()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 0_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_
- `wireUp()` --indirect_call--> `joinHousehold()`  [INFERRED]
  app.js → app.js  _Bridges community 7 → community 0_
- `matchesFilter()` --calls--> `stageOf()`  [EXTRACTED]
  app.js → app.js  _Bridges community 3 → community 6_

## Import Cycles
- None detected.

## Communities (13 total, 3 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.42
Nodes (9): generateCode(), leaveHousehold(), loadHouseholds(), openHousehold(), rememberHousehold(), showJoin(), showView(), start() (+1 more)

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "openProduct"
Cohesion: 0.27
Nodes (10): addLocationFromProductForm(), addMonths(), fillLocationSelect(), formatDate(), hideNewLocationRow(), locationOf(), onLocationSelectChange(), openProduct() (+2 more)

### Community 3 - "t"
Cohesion: 0.32
Nodes (15): addShoppingFromForm(), addToShopping(), deleteLocation(), deleteProduct(), deleteProductBySwipe(), loadData(), markBought(), renderLocations() (+7 more)

### Community 5 - "app.js"
Cohesion: 0.18
Nodes (7): db, ITEM_ACTIONS, lang, rememberedHousehold(), SERVER_ERRORS_EN, state, STRINGS

### Community 6 - "render"
Cohesion: 0.26
Nodes (12): addLocationFromDialog(), createLocation(), fillHouseholdSelect(), locationErrorMessage(), matchesFilter(), openLocations(), openSettings(), renameHousehold() (+4 more)

### Community 7 - "afterJoin"
Cohesion: 0.50
Nodes (4): afterJoin(), createHousehold(), joinHousehold(), serverMessage()

### Community 8 - "renderItem"
Cohesion: 0.29
Nodes (11): attachGestures(), closeItemMenu(), daysUntil(), el(), expiryStatus(), openItemMenu(), relativeDays(), renderExtendCheck() (+3 more)

### Community 12 - "scheduleReload"
Cohesion: 0.50
Nodes (4): isUserBusy(), scheduleReload(), subscribeToChanges(), unsubscribeFromChanges()

## Knowledge Gaps
- **14 isolated node(s):** `db`, `state`, `STRINGS`, `SERVER_ERRORS_EN`, `lang` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `t` to `wireUp`, `openProduct`, `app.js`, `render`, `afterJoin`, `renderItem`, `setLanguage`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `wireUp()` connect `wireUp` to `openProduct`, `t`, `app.js`, `render`, `afterJoin`, `renderItem`, `setLanguage`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `STRINGS` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._