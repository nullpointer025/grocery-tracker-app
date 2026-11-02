# Graph Report - grocery-tracker-app  (2026-11-02)

## Corpus Check
- 11 files · ~17,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 112 nodes · 308 edges · 10 communities (9 shown, 1 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6718d282`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- wireUp
- Setup
- openProduct
- t
- index.ts
- app.js
- renderLocations
- renderItem
- sw.js

## God Nodes (most connected - your core abstractions)
1. `t()` - 33 edges
2. `wireUp()` - 28 edges
3. `loadData()` - 16 edges
4. `render()` - 15 edges
5. `toast()` - 15 edges
6. `renderItem()` - 13 edges
7. `openHousehold()` - 12 edges
8. `el()` - 10 edges
9. `openProduct()` - 10 edges
10. `showMsg()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `wireUp()` --indirect_call--> `applyTheme()`  [INFERRED]
  app.js → app.js  _Bridges community 5 → community 0_
- `wireUp()` --indirect_call--> `addShoppingFromForm()`  [INFERRED]
  app.js → app.js  _Bridges community 3 → community 0_
- `wireUp()` --indirect_call--> `updateExtendHint()`  [INFERRED]
  app.js → app.js  _Bridges community 2 → community 0_
- `wireUp()` --indirect_call--> `openLocations()`  [INFERRED]
  app.js → app.js  _Bridges community 6 → community 0_
- `matchesFilter()` --calls--> `stageOf()`  [EXTRACTED]
  app.js → app.js  _Bridges community 3 → community 6_

## Import Cycles
- None detected.

## Communities (10 total, 1 thin omitted)

### Community 0 - "wireUp"
Cohesion: 0.22
Nodes (16): afterJoin(), createHousehold(), generateCode(), joinHousehold(), leaveHousehold(), loadHouseholds(), openHousehold(), rememberedHousehold() (+8 more)

### Community 1 - "Setup"
Cohesion: 0.18
Nodes (10): 1. Create the database, 2. Connect the app, 3. Notifications (optional, can be done later), 4. Put it online with GitHub Pages, 5. Install on the iPhone, Database updates, Grocery Tracker, Setup (+2 more)

### Community 2 - "openProduct"
Cohesion: 0.27
Nodes (10): addLocationFromProductForm(), addMonths(), fillLocationSelect(), formatDate(), hideNewLocationRow(), locationOf(), onLocationSelectChange(), openProduct() (+2 more)

### Community 3 - "t"
Cohesion: 0.26
Nodes (19): addShoppingFromForm(), addToShopping(), deleteProduct(), deleteProductBySwipe(), isUserBusy(), loadData(), markBought(), renameHousehold() (+11 more)

### Community 4 - "index.ts"
Cohesion: 0.29
Nodes (4): buildPayload(), Lang, shortDate(), TEXTS

### Community 5 - "app.js"
Cohesion: 0.12
Nodes (22): applyStaticTexts(), applyTheme(), currentSubscription(), currentTheme(), darkQuery, db, fillHouseholdSelect(), isIOS (+14 more)

### Community 6 - "renderLocations"
Cohesion: 0.29
Nodes (10): addLocationFromDialog(), createLocation(), deleteLocation(), locationErrorMessage(), matchesFilter(), openLocations(), renameLocation(), renderFilters() (+2 more)

### Community 8 - "renderItem"
Cohesion: 0.36
Nodes (9): attachGestures(), closeItemMenu(), daysUntil(), el(), expiryStatus(), openItemMenu(), relativeDays(), renderItem() (+1 more)

## Knowledge Gaps
- **19 isolated node(s):** `db`, `state`, `STRINGS`, `SERVER_ERRORS_EN`, `lang` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `t` to `wireUp`, `openProduct`, `app.js`, `renderLocations`, `renderItem`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `wireUp()` connect `wireUp` to `openProduct`, `t`, `app.js`, `renderLocations`, `renderItem`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `wireUp()` (e.g. with `addLocationFromDialog()` and `addLocationFromProductForm()`) actually correct?**
  _`wireUp()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `STRINGS` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._