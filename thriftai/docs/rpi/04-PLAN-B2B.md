# Veritas B2B plan: marketplaces, retailers and clothing brands

> Status: **decided 2026-10-25** (Asjad): score-picked ads with labelled sponsored slots outside the top 3; keep the 27-factor engine and show three drivers; build ingest and ads/social now. Phases B10/B11/F8 are tracked in 02/03; this file is the why and the data contract.

## 1. Who buys

| Customer | Their problem | What they buy |
|---|---|---|
| **Multi-vendor marketplaces and big retailers** (primary) | Thousands of near-identical listings from many sellers. Shoppers can't tell good from bad, so they buy, try and return. Search ranks by sales and clicks, which favours whatever already sells, including items that come back. | Score feed + API for search ranking, collections, product pages and ads; vendor-quality view |
| **Clothing brands** (secondary, they sell on those platforms) | They see sales and returns, not *why*. Reviews are scattered across platforms. | Brand dashboard: why each product scores what it does, what to fix |

## 2. Why pay, if everyone already knows what sells?

1. **Best-seller is not best-kept.** Sales rank counts the sale, not the return. In fashion a large share of orders come back, and the platform pays for shipping and handling both ways. The score ranks by *likely to be kept*: fit evidence, durability, honest photos.
2. **Vendor-neutral quality signal.** On a marketplace the same tee is listed by 20 sellers. Stars are inflated and per-listing. Veritas reads the evidence across listings and gives one comparable number per product, plus a brand reputation built from all of a brand's products.
3. **Trust protects the platform.** Fake markdowns and misleading photos get flagged before shoppers complain.
4. **Better fashion search.** Search can ask "who is it for, budget, fit?" and rank by "worth buying for me", not "most clicked".
5. **Measurable.** Every integration ships as an A/B test on the platform's own numbers: return rate, conversion, repeat purchase. We never quote results we haven't measured.

## 3. Why AI, and where it is *not* used

| AI does (reading and language) | Code does (decisions) |
|---|---|
| Reads review text at scale: "runs small", "shrank after 3 washes", typos, other languages | Computes every score (deterministic, versioned, auditable) |
| Spots manipulation (injected instructions, suspicious reviews) | Price history, fake-discount detection, return rates, brand roll-ups |
| Writes shopper text and ad copy **from evidence only**, then a second agent verifies every sentence | Ranking, filters, collections, which products go into ads |
| Shopkeeper search: asks 2–4 questions, understands "cheaper", "not black" | Budget caps, rate limits, tracing |
| Cleans messy vendor titles into attributes (colour, fit, material) when the feed lacks them | Validation of every imported row |

Pitch for buyers: *"AI reads every review so your search doesn't have to guess; code makes the score, so it's explainable and can't be bought."*

## 4. The score, explained simply

The 27-factor engine stays (it already works and is tested), but buyers and shoppers see **three drivers**, matching the data platforms actually have:

| Driver | Built from | Data source |
|---|---|---|
| **Product quality** (fit, durability, comfort, looks as pictured) | Review text + star ratings + fit answers (+ returns if shared) | Reviews feed |
| **Price** (fair price now, value vs. similar items) | Price snapshots over time, peer prices | Catalog feed, snapshotted daily |
| **Brand reputation** | Published scores across all of the brand's products | Computed, no extra data |

Everything else (trend, resale, certifications) is optional enrichment and shown only when present.

### Fourth parameter: Style match (2026-10-25)

Shoppers ask for a look ("blue flowered shirt"). Vendors already upload photos, so a vision agent reads each product's photos once into structured attributes (colours, pattern, neckline, sleeve, shape, style tags). Search filters on those attributes, then ranks the matches by the score: the right look, in budget, best quality first. Style match is computed per search and shown next to the three drivers; it never changes the product score. Cost: one Haiku call per new photo (about $0.0002); unchanged photos are never re-read.

## 5. Data in production: three feeds, nothing exotic

| Feed | Frequency | Required fields | Optional |
|---|---|---|---|
| **Catalog** | daily (full or delta) | `external_id, title, brand, category, price, currency, url` | `seller_id, gender, list_price, sizes, colors, materials, image_url, care, description` |
| **Reviews** | daily delta | `external_id, product_external_id, rating, text, date` | `verified, size_bought, fit_answer (small/true/large), height_cm, body_type, language` |
| **Returns** (optional) | weekly | `external_id, product_external_id, reason, date` (`units_sold` goes in the catalog feed) | `size` |

- **Delivery:** CSV/JSON file upload, or an authenticated push API (`POST /api/v1/ingest/{catalog|reviews|returns}`) with the tenant's API key. Idempotent upserts by `external_id`, so re-sending a file is safe.
- **Price history** is built by us from daily catalog snapshots: no separate price feed.
- **Every record** stores `source` and `licence`; tenants' data stays private to them.
- **Validation report** per upload: rows accepted, rows rejected with the reason, products that became ratable.
- **Re-rating** runs only for products whose inputs changed (existing inputs hash); cost is printed before each batch.
- **Daily price feeds cost $0 in model calls:** the paid review-reading agent re-runs only when a product's review or return *text* changed; otherwise its last evidence is reused (verified 2026-10-25: a price-only change re-rated with no agent call).
- **Privacy:** imported products are `isPrivate`; public pages never show them; an API key sees public products plus its own tenant's.

## 6. Revenue features for platforms

**Rule that keeps the score worth trusting:** money can choose *where* a product is shown, never *what score* it gets. Organic picks (the 3 picks, collections) are never paid.

1. **Score-ranked search and collections** (built).
2. **Score-based ads ("promote what's worth buying")**: eligible = score ≥ 70, confidence not low or new-launch, no fake sale price, not often returned. "Often cheaper" is a feed label, not a block (the price is honest, just not the lowest lately).
   - Ad feed export: the platform's catalog with extra labels (score tier, top highlight such as "True to size", price status) in the standard catalog-feed format that ad and social platforms import. The platform's ad tools then target only well-scored, honestly priced items.
   - Ad copy agent: headline + description per product, written only from verified evidence ("True to size for 9 of 11 owners"), checked by the Verifier, within each format's length limits, no hype.
   - On-site sponsored slots (optional, labelled "Sponsored"): only products above a score threshold, never inside the top 3.
3. **Social:** auto-generated "Top rated this week" posts and creator pick lists per category, with verified copy and tracked links back to the product. Delivered as a feed or CSV the social team schedules, so there's no per-network integration to maintain at first.
4. **Personal picks in campaigns** (later): segments by size/budget/style from the shopkeeper conversations (consented, anonymous).

## 7. AI agents and their jobs

| Agent | Status | Job |
|---|---|---|
| Evidence | built | Reads reviews/returns → evidence with grounded quotes |
| Writer + Verifier | built | Shopper text, every sentence verified |
| Shopkeeper | built | Conversational search |
| Product Q&A | built | Answers shopper questions from evidence |
| **Ad copy** | new | Ad headlines/descriptions from verified evidence |
| **Catalog cleaner** | new, optional | Fills missing colour/fit/material from messy vendor titles (code rules first, agent only for leftovers) |

## 8. Phases (proposed)

- **B10 · Ingest** (first, needed for any pilot): data contract, CSV/JSON upload + push API, validation report, daily snapshots → price history, tenant scoping, dry-run mode. Gate: import a sample marketplace file (fictional) of 200 products + 2,000 reviews end to end, re-run is a no-op, bad rows reported.
- **B11 · Ads and social:** ad-feed export with labels, ad copy agent + verifier, "Top rated this week" social pack, campaign preview page. Gate: feed validates against the format spec; 10 live ad copies, cost measured, 100% verified.
- **F8 · Platform UI:** upload screen with validation report, ad/social preview, three-driver score display.

## 9. Decisions (2026-10-25)

1. Ads: score-chosen ads + labelled sponsored slots outside the top 3. ✅
2. Score display: keep the 27-factor engine, show three drivers. ✅
3. Order: ingest and ads/social both now. ✅
4. Still open: pricing for marketplaces (today: Platform = annual contract) and per-category benchmarks from real platform data.
